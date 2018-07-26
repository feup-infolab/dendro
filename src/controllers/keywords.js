require("babel-polyfill");

let async = require("async");
let natural = require("natural");
let tokenizer = new natural.WordTokenizer();
let stringSimilarity = require("string-similarity");
let stripTags = require("striptags");

let stopWords = require("stopwords").english;
const corenlp = require("corenlp");
const coreNLP = corenlp.default;
const connector = new corenlp.ConnectorServer({
    dsn: "http://localhost:9000"
});

const props = new corenlp.Properties({
    annotators: "tokenize,ssplit,pos,ner"
});
const pipeline = new corenlp.Pipeline(props, "English", connector);

let doc;
let method;
let request = require("request");
let baseRequest = request.defaults({
    headers: {
        Accept: "application/json",
        Connection: "Keep-Alive"
    }
});

let cluster = require("hierarchical-clustering");

exports.processExtract = function (req, res) {
    req.setTimeout(2500000);
    let process = function (text, cb) {
        module.exports.preProcessing(text, function (response) {
            if (response.statusCode === 200) {
                cb(null, response);
            }
            else {
                cb("error pre processing");
            }
        });
    };

    method = req.body.method;
    async.mapSeries(req.body.text, process, function (err, results) {
        if (err) {
            // console.log(err);
            res.status(500).json(
                {
                    error: "error during text preProcessing"
                }
            );
        }
        else {
            module.exports.termExtraction(results, function (output) {
                res.status(200).json(
                    {
                        output
                    });
            });
        }
    });
};

exports.preProcessing = function (req, res) {
    let nounPhrase = function (type, text) {
        /*
          1. Noun+ Noun,
          2. (Adj | Noun)+ Noun,
          3. ((Adj | Noun)+ | ((Adj | Noun)* (NounPrep)?)(Adj| Noun)* ) Noun
        */
        let multiTerm = [];
        let current_word = "";
        let comparision;
        if (type === "nn") {
            for (let j = 0; j < text.length; j++) {
                comparision = text[j];
                if (comparision.pos.charAt(0) === "N" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma)) {
                    if (stopWords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3 || comparision.ner.toString() === "PERSON" || comparision.ner.toString() === "LOCATION" || comparision.ner.toString() === "DATE" || comparision.ner.toString() === "TIME") {
                        // console.log(comparision.lemma.toString());
                    }
                    else {
                        current_word = comparision.lemma;
                        for (let index2 = j + 1; index2 < text.length; index2++) {
                            comparision = text[index2];
                            if (comparision.pos.charAt(0) === "N" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma)) {
                                if (stopWords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3 || comparision.ner.toString() === "PERSON" || comparision.ner.toString() === "LOCATION" || comparision.ner.toString() === "DATE" || comparision.ner.toString() === "TIME") {
                                    // console.log(comparision.lemma.toString());
                                    break;
                                }
                                current_word += (" " + comparision.lemma);
                                multiTerm.push(current_word.toLowerCase());
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
            }
        }
        else if (type === "jj") {
            for (let j = 0; j < text.length; j++) {
                comparision = text[j];
                if ((comparision.pos.charAt(0) === "N" || comparision.pos.charAt(0) === "J") && /^[a-zA-Z\/\-]+$/.test(comparision.lemma)) {
                    if (stopWords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3 || comparision.ner.toString() === "PERSON" || comparision.ner.toString() === "LOCATION" || comparision.ner.toString() === "DATE" || comparision.ner.toString() === "TIME") {
                        // console.log(comparision.word);
                    }
                    else {
                        current_word = comparision.lemma;
                        for (let index2 = j + 1; index2 < text.length; index2++) {
                            comparision = text[index2];
                            if (comparision.pos.charAt(0) === "N" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma)) {
                                if (stopWords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3 || comparision.ner.toString() === "PERSON" || comparision.ner.toString() === "LOCATION" || comparision.ner.toString() === "DATE" || comparision.ner.toString() === "TIME") {
                                    break;
                                }
                                current_word += (" " + comparision.lemma);
                                multiTerm.push(current_word.toLowerCase());
                            }
                            else if (comparision.pos.charAt(0) === "J" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma)) {
                                if (stopWords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3 || comparision.ner.toString() === "PERSON" || comparision.ner.toString() === "LOCATION" || comparision.ner.toString() === "DATE" || comparision.ner.toString() === "TIME") {
                                    break;
                                }
                                if ((text[(index2 + 1)].pos.charAt(0) === "N" || text[(index2 + 1)].pos.charAt(0) === "J") && /^[a-zA-Z\/\-]+$/.test(text[(index2 + 1)].lemma)) {
                                    current_word += (" " + comparision.lemma);
                                }
                                else {
                                    break;
                                }
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
            }
        }

        return [...new Set(multiTerm.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
    };

    function hasNumber(myString) {
        return /\d/.test(myString);
    }

    doc = new coreNLP.simple.Document(req.text);
    pipeline.annotate(doc)
        .then(doc => {
            const sent = doc.toJSON();
            let output = [];
            let comparision;
            let nounPhraseList = [];
            let sentences = [];
            for (let i = 0; i < sent.sentences.length; i++) {
                for (let j = 0; j < JSON.parse(JSON.stringify(sent.sentences[i])).tokens.length; j++) {
                    comparision = JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j];
                    // console.log(comparision.word + " " + comparision.lemma);

                    if (!/^[a-zA-Z\/\-]+$/.test(comparision.word) || comparision.word.indexOf("www") + 1 || comparision.word.indexOf("http") + 1 || comparision.word.indexOf("@") + 1 || hasNumber(comparision.word) || comparision.ner.toString() === "DATE" || comparision.ner.toString() === "TIME") {
                        sentences.push(comparision.word);
                    }
                    else {
                        if (comparision.word.toString() !== comparision.lemma.toString()) {
                            sentences.push(comparision.lemma);
                        }
                        else {
                            sentences.push(comparision.word);
                        }
                        if (comparision.lemma.toString().length > 2) {
                            output.push({
                                word: comparision.word,
                                pos: comparision.pos,
                                lemma: comparision.lemma.toString()
                            });
                        }
                    }
                }
                if (method === "CValueJJ") {
                    nounPhraseList = nounPhraseList.concat(nounPhrase("jj", JSON.parse(JSON.stringify(sent.sentences[i])).tokens, null));
                }
                else if (method === "CValueNN") {
                    nounPhraseList = nounPhraseList.concat(nounPhrase("nn", JSON.parse(JSON.stringify(sent.sentences[i])).tokens, null));
                }
            }
            nounPhraseList = [...new Set(nounPhraseList.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));
            output = [...new Set(output.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));

            res({
                statusCode: 200,
                method: req.method,
                text: sentences.join(" "),
                output,
                nounPhraseList: nounPhraseList
            });
        })
        .catch(err =>
            err);
};

exports.termExtraction = function (req, res) {
    let removeExtraTerms = function (nounPhrases) {
        let nnf = {frequency: []};
        let contains = false;
        for (let i = 0; i < (nounPhrases.length - 1); i++) {
            contains = false;
            for (let j = 0; j < nounPhrases.length; j++) {
                if (tokenizer.tokenize(nounPhrases[i].word).length === tokenizer.tokenize(nounPhrases[j].word).length) {
                    if ((nounPhrases[j].word.indexOf(nounPhrases[i].word) > -1) && nounPhrases[i].word !== nounPhrases[j].word) {
                        contains = true;
                        break;
                    }
                }
            }
            if (contains === false) {
                nnf.frequency.push({word: nounPhrases[i].word, cvalue: nounPhrases[i].cvalue});
            }
        }
        return nnf.frequency;
    };

    let headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
    };
    let yake = function (lookup, cb) {
        let dataString = "content=" + lookup;

        let options = {
            url: "https://boiling-castle-88317.herokuapp.com/yake/v2/extract_keywords?max_ngram_size=3&number_of_keywords=30",
            method: "POST",
            headers: headers,
            body: dataString
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                cb(null, JSON.parse(body));
            }
            else {
                // console.log("status code: " + response.statusCode);
                cb(error);
            }
        });
    };

    function WordCount(str) {
        return str.split(" ").length;
    }

    function countOccurrences(str, value) {
        let regExp = new RegExp(value, "gi");
        return (str.match(regExp) || []).length;
    }


    let termhood = function (list) {
        let freq = 0;
        let finalList = list;
        for (let i = 0; i < list.length; i++) {
            freq = 0;
            if (list[i].nested === false) {
                finalList[i].termhood = list[i].frequency;
            }
            else {
                for (let j = 0; j < finalList[i].nestedTerms.length; j++) {
                    let nested = false;
                    for (let h = 0; h < j; h++) {
                        if (finalList[i].nestedTerms[h].term.indexOf(finalList[i].nestedTerms[j].term) === 0) {
                            nested = true;
                        }
                    }
                    if (nested === true) {
                        freq -= finalList[i].nestedTerms[j].frequency;
                    }
                    else {
                        freq += finalList[i].nestedTerms[j].frequency;
                    }
                }
                finalList[i].nestedFreq = freq;
            }
        }

        return finalList;
    };

    let isNested = function (list, nGrams) {
        let nestedList = list;
        let i;
        let j;
        for (i = 0; i < nestedList.length; i++) {
            if (tokenizer.tokenize(nestedList[i].word).length === nGrams) {
                nestedList[i].nested = false;
            }
            else {
                for (j = 0; j < nestedList.length; j++) {
                    if (nestedList[j].word.indexOf(nestedList[i].word) > -1) {
                        if (nestedList[j].word !== nestedList[i].word) {
                            nestedList[i].nested = true;
                            nestedList[i].nestedTerms.push({
                                term: nestedList[j].word,
                                frequency: nestedList[j].frequency
                            });
                        }
                    }
                }
            }
        }
        return nestedList;
    };
    /*
    function countnestedterms (x, list)
    {
        var nested = 0;
        var nestedlist = [];
        for (var i = 0; i < list.length; i++)
        {
            if (tokenizer.tokenize(list[i]).length > tokenizer.tokenize(x).length)
            {
                if (list[i].indexOf(x) > -1)
                {
                    nested++;
                    if (nestedlist.indexOf(list[i]) > -1)
                    {

                    }
                    else
                    {
                        nestedlist.push(list[i]);
                    }
                }
            }
        }
        return {nested: nested, nestedlist: nestedlist};

        let c = 0;
        for (let y = 0; y < list.length; y++)
        {
            if (list[y].toString().includes(x.toString()) && list[y].toString() !== x.toString())
            {
                c++;
            }
        }
        return c;
    }
    function getcombination (word)
    {
        let combinationwords = [];
        for (let i = 0; i < tokenizer.tokenize(word).length; i++)
        {
            if ((i + 1) < tokenizer.tokenize(word).length)
            {
                combinationwords.push(tokenizer.tokenize(word)[i] + " " + tokenizer.tokenize(word)[i + 1]);
            }
        }
        return combinationwords;
    }*/
    let cvalue = function (input, corpus, nGrams) {
        let words = {frequency: []};
        let i;
        // 1st para in async.each() is the array of items

        for (i = 0; i < input.length; i++) {
            let frequency = 0;
            for (let j = 0; j < corpus.length; j++) {
                frequency += countOccurrences(corpus[j].toLowerCase(), input[i]);
            }
            words.frequency.push({
                word: input[i],
                size: tokenizer.tokenize(input[i]).length,
                cvalue: 0,
                termhood: 0,
                frequency: frequency,
                nested: false,
                nestedFreq: 0,
                nestedTerms: []
            });
            /* if (frequency > 1 && Math.log2(frequency) >= maxthreshold)
            {
              threshold.push({term: input[i], threshold: Math.log2(frequency)});
              substrings = getcombination(input[i]);
              console.log(substrings);
              for (var h = 0; h < substrings.length; h++)
              {
                var freq = 0;
                for (var k = 0; k < corpus.length; k++)
                {
                  frequency += occurences(corpus[k].toLowerCase(), substrings[h]);
                  frequencysubstrings = countnestedterms(substrings[h], input);
                }
                usedwords.push(substrings[h]);
              }
            }*/
        }
        words.frequency = isNested(words.frequency, nGrams);
        words.frequency = termhood(words.frequency);
        let cv;
        for (i = 0; i < words.frequency.length; i++) {
            if (words.frequency[i].nested === false) {
                words.frequency[i].cvalue = Math.log2(words.frequency[i].size) * words.frequency[i].frequency;
            }
            else {
                words.frequency[i].cvalue = Math.log2(words.frequency[i].size) * (words.frequency[i].frequency - (1 / words.frequency[i].nestedTerms.length) * words.frequency[i].nestedFreq);
            }
        }
        words.frequency.sort(function (a, b) {
            return b.cvalue - a.cvalue;
        });
        cv = words.frequency[Math.floor(words.frequency.length * 0.25)].cvalue;
        let cvalueThreshold = [];
        for (i = 0; i < words.frequency.length; i++) {
            if (words.frequency[i].cvalue >= cv) {
                cvalueThreshold.push(words.frequency[i]);
            }
        }

        return cvalueThreshold;
    };

    let getContextWords = function (cvalue) {
        let contextWords = [];
        for (let i = 0; i < cvalue.length; i++) {
            contextWords.push(tokenizer.tokenize(cvalue[i].word)[0]);
        }
        return [...new Set(contextWords.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
    };
    let getWeight = function (cvalue, contextWords, length) {
        let weight = [];
        let freq = 0;
        for (let i = 0; i < cvalue.length; i++) {
            freq = 0;
            for (let j = 0; j < cvalue.length; j++) {
                if (cvalue[j].word.indexOf(contextWords[i]) > -1) {
                    freq++;
                }
            }
            weight[i] = (freq / length);
        }
        return weight;
    };
    let ncvalue = function (cvalue, length) {
        let ncvalueList = {frequency: []};
        let contextWords = getContextWords(cvalue);
        let weight = getWeight(cvalue, contextWords, length);
        let weightSum;
        let ncvalue;
        for (let i = 0; i < cvalue.length; i++) {
            weightSum = 0;
            for (let j = 0; j < contextWords.length; j++) {
                if (cvalue[i].word.indexOf(contextWords[j]) > -1) {
                    weightSum += (cvalue[i].frequency - weight[j]);
                }
            }
            ncvalue = (0.8 * cvalue[i].cvalue) + (0.2 * weightSum);
            ncvalueList.frequency.push({word: cvalue[i].word, ncvalue: ncvalue});
        }
        ncvalueList.frequency.sort(function (a, b) {
            // ASC  -> a.length - b.length
            // DESC -> b.length - a.length
            return b.ncvalue - a.ncvalue;
        });
        return ncvalueList.frequency;
    };

    let processedTest = req;
    let results = [];
    let documents = [];
    let documentLength = [];
    let nounPhrase = [];
    for (let i = 0; i < processedTest.length; i++) {
        results.push(processedTest[i].result);
        nounPhrase.push(processedTest[i].nounPhraseList);
        documents.push(processedTest[i].text.toString());
        documentLength.push(WordCount(processedTest[i].text.toString()));
    }

    if (method === "Yake!") {
        async.mapSeries(documents, yake, function (err, results) {
            if (err) {
                // console.log(err);
                res.status(500).json(
                    {
                        error: "error during yake lookup"
                    }
                );
            }
            else {
                let dbpediaTerms = {
                    keywords: []
                };

                for (let i = 0; i < results.length; i++) {
                    for (let j = 0; j < results[i].keywords.length; j++) {
                        dbpediaTerms.keywords.push({
                            words: results[i].keywords[j].ngram,
                            score: results[i].keywords[j].score
                        });
                    }
                }

                dbpediaTerms.keywords = dbpediaTerms.keywords.reduceRight(function (r, a) {
                    r.some(function (b) {
                        return a.words === b.words;
                    }) || r.push(a);
                    return r;
                }, []);
                dbpediaTerms.keywords.sort(function (a, b) {
                    return parseFloat(a.score) - parseFloat(b.score);
                });

                res(
                    {
                        dbpediaTerms: dbpediaTerms
                    }
                );
            }
        });
    }
    else {
        let nounPhraseFinal = [];
        let dbpediaTerms = {
            keywords: []
        };

        for (let i = 0; i < nounPhrase.length; i++) {
            for (let j = 0; j < nounPhrase[i].length; j++) {
                nounPhraseFinal.push(nounPhrase[i][j]);
            }
        }

        let nounPhraseSimple = [...new Set(nounPhraseFinal.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));

        nounPhraseSimple.sort(function (a, b) {
            return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
        });

        // var ngrams = [];
        /* for (let i = 0; i < nounphrasesimple.length; i++)
            {
                if (tokenizer.tokenize(nounphrasesimple[i]).length <= 5 && tokenizer.tokenize(nounphrasesimple[i]).length >= 2)
                {
                    ngrams.push(nounphrasesimple[i]);
                }
                else
                {
                    // console.log(nounphrasesimple[i]);
                }
            }
            ngrams.sort(function (a, b)
            {
            // ASC  -> a.length - b.length
            // DESC -> b.length - a.length
                return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
            });*/

        let cvaluengrams = cvalue(nounPhraseSimple, documents, tokenizer.tokenize(nounPhraseSimple[0]).length);
        ncvalue(cvaluengrams, cvaluengrams.length);

        let nnnn = removeExtraTerms(cvaluengrams);

        nnnn.sort(function (a, b) {
            return b.cvalue - a.cvalue;
        });

        for (let index = 0; index < nnnn.length; index++) {
            if (tokenizer.tokenize(nnnn[index].word).length <= 3) {
                dbpediaTerms.keywords.push({
                    words: nnnn[index].word,
                    score: nnnn[index].cvalue
                });
            }
        }

        dbpediaTerms.keywords.sort(function (a, b) {
            return parseFloat(b.score) - parseFloat(a.score);
        });

        res(
            {
                dbpediaTerms: dbpediaTerms
            }
        );
    }
};

exports.dbpediaLookup = function (req, res) {
    req.setTimeout(2500000);

    let searchDb = function (lookup, cb) {
        // baseRequest("http://lookup.dbpedia.org/api/search/PrefixSearch?QueryClass=&MaxHits=25&QueryString=" + lookup.words, function getResponse (error, response, body)
        baseRequest("http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=&MaxHits=25&QueryString=" + lookup.words, function getResponse(error, response, body)
            // baseRequest("http://lov.okfn.org/dataset/lov/api/v2/term/search?q=" + lookup.words + "&type=property", function getResponse (error, response, body)
        {
            if (!error && response.statusCode === 200) {
                cb(null, JSON.parse(body));
            }
            else {
                // console.log("error: " + error);
                // console.log("status code: " + response.statusCode);
                cb(error);
            }
        });
    };
    let dbpediaResults = req.body.keywords;

    let dbpediaUri = {result: []};
    let position;
    async.mapSeries(dbpediaResults, searchDb, function (err, results2) {
        if (err) {
            res.status(500).json(
                {
                    dbpediaUri: dbpediaUri
                }
            );
        }
        else {
            for (let i = 0; i < results2.length; i++) {
                if (results2[i] !== undefined && results2[i].results[0] != null) {
                    position = 0;
                    let similar = 0;
                    for (let x = 0; x < results2[i].results.length; x++) {
                        let current = stringSimilarity.compareTwoStrings(dbpediaResults[i].words, results2[i].results[x].label);
                        if (current > similar) {
                            similar = Number(current);
                            position = x;
                        }
                    }
                    dbpediaUri.result.push({
                        searchTerm: dbpediaResults[i].words,
                        score: dbpediaResults[i].score,
                        dbpediaLabel: results2[i].results[position].label,
                        dbpediaUri: results2[i].results[position].uri,
                        dbpediaDescription: results2[i].results[position].description
                    });
                }

                else {
                    // console.log("results for word : " + dbpediaresults[i].words + " undefined");
                    dbpediaUri.result.push({
                        searchTerm: dbpediaResults[i].words,
                        score: dbpediaResults[i].score,
                        error: "undefined term in dbpedia"
                    });
                }
            }
            res.status(200).json(
                {
                    dbpediaUri: dbpediaUri
                }
            );
        }
    });
};

exports.dbpediaProperties = function (req, res) {
    req.setTimeout(2500000);
    let searchlov = function (dbpedia, cb) {
        baseRequest("http://lov.okfn.org/dataset/lov/api/v2/term/search?q=" + dbpedia.searchTerm + "&type=property", function getResponse(error, response, body) {
            if (!error && response.statusCode === 200) {
                cb(null, JSON.parse(body));
            }
            else {
                cb(error);
            }
        });
    };

    let dbpediaResults = req.body.concepts;
    async.mapSeries(dbpediaResults, searchlov, function (err, results) {
        let dbpediaUri = {
            result: []
        };
        if (err) {
            // console.log(err);
            res.status(500).json(
                {
                    dbpediaUri: dbpediaUri
                }
            );
        }
        else {
            for (let i = 0; i < results.length; i++) {
                if (results[i] !== undefined && results[i].results[0] != null) {
                    /* position = 0;
                        let similar = 0;
                        for (let x = 0; x < results[i].results.length; x++)
                        {
                            let current = stringSimilarity.compareTwoStrings(dbpediaresults[i].words, results[i].results[x].uri[0]);
                            if (current > similar)
                            {
                                similar = Number(current);
                                position = x;
                            }
                        }*/
                    // var ret = results[i].results[position].prefixedName[0].toString().replace(results[i].results[position]["vocabulary.prefix"][0].toString(), "");
                    // console.log("highlight: " + ret);
                    let lovlabel;
                    let lov_highlight;
                    if (Object.values(results[i].results[0].highlight)[0] !== undefined) {
                        lovlabel = stripTags(Object.values(results[i].results[0].highlight)[0].toString());
                    }
                    else {
                        lovlabel = "";
                    }
                    if (Object.values(results[i].results[0].highlight)[1] !== undefined) {
                        lov_highlight = stripTags(Object.values(results[i].results[0].highlight)[1].toString());
                    }
                    else {
                        lov_highlight = "";
                    }
                    if (!dbpediaUri.result.some(item => item.lovLabel === lovlabel)) {
                        dbpediaUri.result.push({
                            searchTerm: dbpediaResults[i].searchTerm,
                            score: dbpediaResults[i].score,
                            lovScore: results[i].results[0].score,
                            lovVocabulary: results[i].results[0]["vocabulary.prefix"][0],
                            lovUri: results[i].results[0].uri[0],
                            lovLabel: lovlabel,
                            lov_highlight: lov_highlight,
                            lov_label_and_highlight: Object.values(results[i].results[0].highlight)[0]
                        });
                    }
                    else {
                        dbpediaUri.result.push({
                            searchTerm: dbpediaResults[i].searchTerm,
                            score: dbpediaResults[i].score,
                            lovScore: results[i].results[0].score,
                            lovVocabulary: results[i].results[0]["vocabulary.prefix"][0],
                            lovUri: results[i].results[0].uri[0],
                            lovLabel: "",
                            lov_highlight: lov_highlight,
                            lov_label_and_highlight: Object.values(results[i].results[0].highlight)[0]
                        });
                    }
                }
                else {
                    dbpediaUri.result.push({
                        searchTerm: dbpediaResults[i].searchTerm,
                        score: dbpediaResults[i].score,
                        error: "undefined term in lov"
                    });
                }
            }
            res.status(200).json(
                {
                    dbpediaUri: dbpediaUri
                }
            );
        }
    });
};

exports.clustering = function (req, res) {
    function splitTerm(term) {
        let termTokens = [];
        let currentTerm;
        for (let i = 0; i < tokenizer.tokenize(term).length; i++) {
            termTokens.push(tokenizer.tokenize(term)[i]);
            currentTerm = tokenizer.tokenize(term)[i];
            for (let j = (i + 1); j < tokenizer.tokenize(term).length; j++) {
                currentTerm += (" " + tokenizer.tokenize(term)[j]);
                termTokens.push(currentTerm);
            }
        }
        termTokens.sort(function (a, b) {
            return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
        });
        return termTokens;
    }

    function lexicalSimilarity(listA, listB) {
        let similarity = 0;
        let equal = 0;
        if (tokenizer.tokenize(listA[0])[tokenizer.tokenize(listA[0]).length - 1] === tokenizer.tokenize(listB[0])[tokenizer.tokenize(listB[0]).length - 1]) {
            // console.log(tokenizer.tokenize(listA[0]));
            // console.log(tokenizer.tokenize(listB[0]));
            similarity = (1 / 2);
        }
        else {
            similarity = 0;
        }
        for (let i = 0; i < listA.length; i++) {
            for (let j = 0; j < listB.length; j++) {
                if (listA[i] === listB[j]) {
                    equal++;
                }
            }
        }
        similarity = (similarity + (equal / (listA.length + listB.length)));
        return similarity;
    }

    let dbpediaResults = req.body.terms;

    let testArray = [];
    let headwords = [];
    for (let i = 0; i < dbpediaResults.length; i++) {
        testArray.push(splitTerm(dbpediaResults[i].words));
    }
    for (let i = 0; i < testArray.length; i++) {
        headwords.push(tokenizer.tokenize(testArray[i][0])[tokenizer.tokenize(testArray[i][0]).length - 1]);
    }

    let headSimple = [...new Set(headwords.map(obj => JSON.stringify(obj)))]
        .map(str => JSON.parse(str));

    function distance(a, b) {
        return lexicalSimilarity(splitTerm(a.words), splitTerm(b.words));
    }

    let levels = cluster({
        input: dbpediaResults,
        distance: distance,
        linkage: "average",
        minClusters: headSimple.length // only want two clusters
    });

    let clusters = levels[levels.length - 1].clusters;

    clusters = clusters.map(function (cluster) {
        return cluster.map(function (index) {
            return dbpediaResults[index];
        });
    });
    clusters.sort(function (a, b) {
        return b.length - a.length;
    });

    res.status(200).json(
        {
            clusters
        }
    );
};

exports.text2owl = function (rec, res) {

};
