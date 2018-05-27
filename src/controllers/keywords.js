require("babel-polyfill");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Uploader = require(Pathfinder.absPathInSrcFolder("/utils/uploader.js")).Uploader;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;

var async = require("async");
var natural = require("natural");
var tokenizer = new natural.WordTokenizer();
var stringSimilarity = require("string-similarity");
var striptags = require("striptags");

var tm = require("text-miner");
var stopwords = require("stopwords").english;
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

var request = require("request");
var baseRequest = request.defaults({
    headers: {
        Accept: "application/json",
        Connection: "Keep-Alive"
    }
});
var dps = require("dbpedia-sparql-client").default;

exports.processextract = function (req, res) {
    req.setTimeout(2500000);
    var process = function (text, cb)
    {
        console.log("processing : " + text.text);
        module.exports.preprocessing(text, function (response)
        {
            console.log(response);
            if(response.statusCode === 200) {
                cb(null,response);
            }
            else {
                cb("error pre processing");
            }
        });

    };

    console.log(req.body.length);

    async.mapSeries(req.body, process, function (err, results)
    {
        if (err)
        {
            // console.log(err);
            res.status(500).json(
                {
                    error: "error during text preprocessing"
                }
            );
        }
        else
        {
            console.log(err);
            console.log(results);
            module.exports.termextraction(results, function(output){
                res.status(200).json(
                    {
                        output
                    });
            });

        }
    });

}

exports.preprocessing = function (req, res)
{
    var nounphrase = function (type, text, res)
    {
    /*
      1. Noun+ Noun,
      2. (Adj | Noun)+ Noun,
      3. ((Adj | Noun)+ | ((Adj | Noun)* (NounPrep)?)(Adj| Noun)* ) Noun
    */
        var multiterm = [];
        var tokenize;
        var current_word = "";
        var comparision;
        if (type === "nn")
        {
            for (let j = 0; j < text.length; j++)
            {
                comparision = text[j];
                if (comparision.pos.charAt(0) === "N" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma))
                {
                    if (stopwords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3)
                    {
                        // console.log(comparision.lemma.toString());
                    }
                    else
                    {
                        current_word = comparision.lemma;
                        for (let index2 = j + 1; index2 < text.length; index2++)
                        {
                            comparision = text[index2];
                            if (comparision.pos.charAt(0) === "N" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma))
                            {
                                if (stopwords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3)
                                {
                                    // console.log(comparision.lemma.toString());
                                    break;
                                }
                                current_word += (" " + comparision.lemma);
                                multiterm.push(current_word.toLowerCase());
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                }
            }
        }
        else if (type === "jj")
        {
            for (let j = 0; j < text.length; j++)
            {
                comparision = text[j];
                if ((comparision.pos.charAt(0) === "N" || comparision.pos.charAt(0) === "J") && /^[a-zA-Z\/\-]+$/.test(comparision.lemma))
                {
                    if (stopwords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3)
                    {
                        // console.log(comparision.word);
                    }
                    else
                    {
                        current_word = comparision.lemma;
                        for (let index2 = j + 1; index2 < text.length; index2++)
                        {
                            comparision = text[index2];
                            if (comparision.pos.charAt(0) === "N" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma))
                            {
                                if (stopwords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3)
                                {
                                    break;
                                }
                                current_word += (" " + comparision.lemma);
                                multiterm.push(current_word.toLowerCase());
                            }
                            else if (comparision.pos.charAt(0) === "J" && /^[a-zA-Z\/\-]+$/.test(comparision.lemma))
                            {
                                if (stopwords.indexOf(comparision.lemma.toLowerCase()) > -1 || comparision.lemma.toString().length < 3)
                                {
                                    break;
                                }
                                if ((text[(index2 + 1)].pos.charAt(0) === "N" || text[(index2 + 1)].pos.charAt(0) === "J") && /^[a-zA-Z\/\-]+$/.test(text[(index2 + 1)].lemma))
                                {
                                    current_word += (" " + comparision.lemma);
                                }
                                else
                                {
                                    break;
                                }
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                }
            }
        }

        const result = [...new Set(multiterm.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
        // console.log(result);
        return result;
    };

    function hasNumber (myString)
    {
        return /\d/.test(myString);
    }

    function replaceAll (str, find, replace)
    {
        // console.log("replacing: " + find + " for " + replace);
        return str.replace(new RegExp("\\b" + find + "\\b", "gi"), replace);
    }
    // console.log(req.text);
    doc = new coreNLP.simple.Document(req.text);
    pipeline.annotate(doc)
        .then(doc =>
        {
            const sent = doc.toJSON();
            // console.log(sent);
            var text = sent.text;
            var output = [];
            var comparision;
            var nounphraselist = [];
            var sentences = [];
            for (var i = 0; i < sent.sentences.length; i++)
            {
                for (var j = 0; j < JSON.parse(JSON.stringify(sent.sentences[i])).tokens.length; j++)
                {
                    comparision = JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j];
                    // console.log(comparision.word + " " + comparision.lemma);

                    if (!/^[a-zA-Z\/\-]+$/.test(comparision.word) || comparision.word.indexOf("www") + 1 || comparision.word.indexOf("http") + 1 || comparision.word.indexOf("@") + 1 || hasNumber(comparision.word) || comparision.ner.toString() === "DATE" || comparision.ner.toString() === "TIME")
                    {
                        // console.log("contain numbers or address " + JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word);
                        sentences.push(comparision.word);
                    }
                    else
                    {
                        if (comparision.word.toString() !== comparision.lemma.toString())
                        {
                            sentences.push(comparision.lemma);
                            // text = replaceAll(text.toString(), comparision.word.toString(), comparision.lemma.toString());
                        }
                        else
                        {
                            sentences.push(comparision.word);
                        }
                        // console.log("word: " + comparision.word + " pos: " + comparision.pos); // + " ner: " + comparision.ner + " lemma: " + comparision.lemma);
                        if (comparision.lemma.toString().length > 2)
                        {
                            output.push({word: comparision.word, pos: comparision.pos, lemma: comparision.lemma.toString()});
                        }
                    }
                }
                nounphraselist = nounphraselist.concat(nounphrase("jj", JSON.parse(JSON.stringify(sent.sentences[i])).tokens, null));
            }
            nounphraselist = [...new Set(nounphraselist.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));
            output = [...new Set(output.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));

            const result = output;
            /*res.status(200).json(
                {
                    text: sentences.join(" "),
                    result,
                    nounphraselist
                }
            );*/
            res({
                statusCode : 200,
                text: sentences.join(" "),
                result,
                nounphraselist
            });
        })
        .catch(err =>
        {
            console.log("err", err);
        });
};

exports.termextraction = function (req, res)
{


    //req.setTimeout(2500000);
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    };
    var yake = function (lookup, cb)
    {

        var dataString="content="+lookup;

        var options = {
            url: 'https://boiling-castle-88317.herokuapp.com/yake/v2/extract_keywords?max_ngram_size=3&number_of_keywords=30',
            method: 'POST',
            headers: headers,
            body: dataString
        };

        request(options, function(error, response, body)
        {
            if (!error && response.statusCode === 200)
            {
                console.log(JSON.parse(body));
                cb(null, JSON.parse(body));
            }
            else
            {
                console.log("error: " + error);
                // console.log("status code: " + response.statusCode);
                cb(error);
            }
        });
    };

    function WordCount (str)
    {
        return str.split(" ").length;
    }

    function countOcurrences (str, value)
    {
        var regExp = new RegExp(value, "gi");
        return (str.match(regExp) || []).length;
    }
    var termhood = function (list)
    {
        var i;
        var j;
        var current;
        var freq = 0;
        var finallist = list;
        for (i = 0; i < list.length; i++)
        {
            freq = 0;
            if (list[i].nested === false)
            {
                finallist[i].termhood = list[i].frequency;
            }
            else
            {
                for (j = 0; j < finallist[i].nestedterms.length; j++)
                {
                    freq += finallist[i].nestedterms[j].frequency;
                }
                finallist[i].nestedfreq = freq;
            }
        }

        return finallist;
    };

    var isNested = function (list, ngrams)
    {
        var nestedlist = list;
        var i;
        var j;
        for (i = 0; i < nestedlist.length; i++)
        {
            if (tokenizer.tokenize(nestedlist[i].word).length === ngrams)
            {
                nestedlist[i].nested = false;
            }
            else
            {
                for (j = 0; j < nestedlist.length; j++)
                {
                    if (nestedlist[j].word.indexOf(nestedlist[i].word) > -1)
                    {
                        if (nestedlist[j].word === nestedlist[i].word)
                        {

                        }
                        else
                        {
                            nestedlist[i].nested = true;
                            nestedlist[i].nestedterms.push({term: nestedlist[j].word, frequency: nestedlist[j].frequency});
                        }
                    }
                }
            }
        }
        return nestedlist;
    };

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

        var c = 0;
        for (var y = 0; y < list.length; y++)
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
        var combinationwords = [];
        var multiword;
        for (var i = 0; i < tokenizer.tokenize(word).length; i++)
        {
            if ((i + 1) < tokenizer.tokenize(word).length)
            {
                combinationwords.push(tokenizer.tokenize(word)[i] + " " + tokenizer.tokenize(word)[i + 1]);
            }
        }
        return combinationwords;
    }
    var cvalue = function (input, corpus, ngrams)
    {
        var words = {frequency: []};
        var i;
        // 1st para in async.each() is the array of items

        for (i = 0; i < input.length; i++)
        {
            var frequency = 0;
            for (var j = 0; j < corpus.length; j++)
            {
                frequency += countOcurrences(corpus[j], input[i]);
            }
            words.frequency.push({word: input[i], size: tokenizer.tokenize(input[i]).length, cvalue: 0, termhood: 0, frequency: frequency, nested: false, nestedfreq: 0, nestedterms: []});
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
        words.frequency = isNested(words.frequency, ngrams);
        words.frequency = termhood(words.frequency);
        var cv = 0;
        for (i = 0; i < words.frequency.length; i++)
        {
            if (words.frequency[i].nested === false)
            {
                words.frequency[i].cvalue = Math.log2(words.frequency[i].size) * words.frequency[i].frequency;
                cv += words.frequency[i].cvalue;
            }
            else
            {
                words.frequency[i].cvalue = Math.log2(words.frequency[i].size) * (words.frequency[i].frequency - (1 / words.frequency[i].nestedterms.length) * words.frequency[i].nestedfreq);
                cv += words.frequency[i].cvalue;
            }
        }
        cv = cv / words.frequency.length;
        var cvaluethreshold = [];
        for (i = 0; i < words.frequency.length; i++)
        {
            if (words.frequency[i].cvalue >= cv)
            {
                cvaluethreshold.push(words.frequency[i]);
            }
        }
        cvaluethreshold.sort(function (a, b)
        {
            return b.cvalue - a.cvalue;
        });

        return cvaluethreshold;
    };

    var getcontextwords = function (cvalue)
    {
        var contextwords = [];
        for (var i = 0; i < cvalue.length; i++)
        {
            contextwords.push(tokenizer.tokenize(cvalue[i].word)[0]);
        }
        var contextwordsimple = [...new Set(contextwords.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
        return contextwordsimple;
    };
    var getWeight = function (cvalue, contextwords, length)
    {
        var weight = [];
        var freq = 0;
        for (var i = 0; i < cvalue.length; i++)
        {
            freq = 0;
            for (var j = 0; j < cvalue.length; j++)
            {
                if (cvalue[j].word.indexOf(contextwords[i]) > -1)
                {
                    freq++;
                }
            }
            weight[i] = (freq / length);
        }
        return weight;
    };
    var ncvalue = function (cvalue, length)
    {
        var ncvaluelist = {frequency: []};
        var contextwords = getcontextwords(cvalue);
        var weight = getWeight(cvalue, contextwords, length);
        var weightsum;
        var ncvalue;
        for (var i = 0; i < cvalue.length; i++)
        {
            weightsum = 0;
            for (var j = 0; j < contextwords.length; j++)
            {
                if (cvalue[i].word.indexOf(contextwords[j]) > -1)
                {
                    weightsum += (cvalue[i].frequency - weight[j]);
                }
            }
            ncvalue = (0.8 * cvalue[i].cvalue) + (0.2 * weightsum);
            ncvaluelist.frequency.push({word: cvalue[i].word, ncvalue: ncvalue});
        }
        ncvaluelist.frequency.sort(function (a, b)
        {
            // ASC  -> a.length - b.length
            // DESC -> b.length - a.length
            return b.ncvalue - a.ncvalue;
        });
        return ncvaluelist.frequency;
    };
    console.log(req);


        var processedtest = req;
        var results = [];
        var documents = [];
        var documentlength = [];
        var nounphrase = [];
        for (let i = 0; i < processedtest.length; i++)
        {
            results.push(processedtest[i].result);
            nounphrase.push(processedtest[i].nounphraselist);
            documents.push(processedtest[i].text.toString());
            documentlength.push(WordCount(processedtest[i].text.toString()));
        }

        var yakeflag = false;
        if (yakeflag === true) {
            async.mapSeries(documents, yake, function (err, results)
            {
                if (err)
                {
                    // console.log(err);
                    res.status(500).json(
                        {
                            error: "error during yake lookup"
                        }
                    );
                }
                else
                {
                    var dbpediaterms = {
                        keywords: []
                    };

                    for(let i = 0; i < results.length; i++) {
                        for (let j = 0; j < results[i].keywords.length; j++) {
                            dbpediaterms.keywords.push({words : results[i].keywords[j].ngram, score:results[i].keywords[j].score});
                        }
                    }
                    dbpediaterms.keywords.sort(function (a, b)
                    {
                        return parseFloat(b.score) - parseFloat(a.score);
                    });
                    var dbpediashort = dbpediaterms.keywords.reduceRight(function (r, a) {
                        r.some(function (b) { return a.words === b.words; }) || r.push(a);
                        return r;
                    }, []);
                    dbpediaterms.keywords = dbpediashort;
                    res.status(200).json(
                        {
                            dbpediaterms
                        }
                    );
                }
            });
        }
        else {

            var score = [];
            var nounphrasefinal = [];
            var dbpediaterms = {
                keywords: []
            };
            var updateVal = function (term, score)
            {
                dbpediaterms.keywords.forEach(function (s)
                {
                    s.term === term && (s.score = score);
                });
            };
                for (let i = 0; i < nounphrase.length; i++)
                {
                    for (let j = 0; j < nounphrase[i].length; j++)
                    {
                        nounphrasefinal.push(nounphrase[i][j]);
                    }
                    // console.log("document size " + documentlength[i]);
                }

            var nounphrasesimple = [...new Set(nounphrasefinal.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));
            nounphrasesimple.sort(function (a, b)
            {
                return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
            });
            var ngrams = [];
            /*for (let i = 0; i < nounphrasesimple.length; i++)
            {
                if (tokenizer.tokenize(nounphrasesimple[i]).length <= 5 && tokenizer.tokenize(nounphrasesimple[i]).length >= 2)
                {
                    ngrams.push(nounphrasesimple[i]);
                }
                else
                {
                    // console.log(nounphrasesimple[i]);
                }
            }*/
            ngrams.sort(function (a, b)
            {
            // ASC  -> a.length - b.length
            // DESC -> b.length - a.length
                return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
            });

            var cvaluengrams = cvalue(nounphrasesimple, documents, tokenizer.tokenize(nounphrasesimple[0]).length);
            var ncvaluengrams = ncvalue(cvaluengrams, cvaluengrams.length);
            // console.log(ncvaluegrams);

            var index;

            dbpediaterms = {
                keywords: []
            };
            for (var index = 0; index < cvaluengrams.length; index++)
            {
                // console.log(dbsearch[i]);
                if (tokenizer.tokenize(cvaluengrams[index].word).length <= 3)
                {
                    dbpediaterms.keywords.push({
                        words: cvaluengrams[index].word,
                        score: cvaluengrams[index].cvalue
                    });
                }
            }

            dbpediaterms.keywords.sort(function (a, b)
            {
                return parseFloat(b.score) - parseFloat(a.score);
            });


            res(
                {
                    dbpediaterms
                }
            );
        }
};

exports.dbpedialookup = function (req, res)
{
    req.setTimeout(2500000);
    var search = function (lookup, cb)
    {
        console.log("searching : " + lookup.words);
        baseRequest("http://lov.okfn.org/dataset/lov/api/v2/term/search?q=" + lookup.words + "&type=property", function getResponse (error, response, body)
        {
            if (!error && response.statusCode === 200)
            {
                cb(null, JSON.parse(body));
            }
            else
            {
                // console.log("error: " + error);
                // console.log("status code: " + response.statusCode);
                cb(error);
            }
        });
    };

    var searchdb = function (lookup, cb)
    {
        console.log("searching : " + lookup.words);
        baseRequest("http://lookup.dbpedia.org/api/search/PrefixSearch?QueryClass=&MaxHits=25&QueryString=" + lookup.words, function getResponse (error, response, body)
        //baseRequest("http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=&QueryString=" + lookup.words, function getResponse (error, response, body)
        // baseRequest("http://lov.okfn.org/dataset/lov/api/v2/term/search?q=" + lookup.words + "&type=property", function getResponse (error, response, body)
        {
            if (!error && response.statusCode === 200)
            {
                cb(null, JSON.parse(body));
            }
            else
            {
                // console.log("error: " + error);
                // console.log("status code: " + response.statusCode);
                cb(error);
            }
        });
    };

    var dbpediaresults = JSON.parse(req.body.keywords).dbpediaterms.keywords;

    async.mapSeries(dbpediaresults, search, function (err, results)
    {
        var dbpediauri = {
            result: []
        };
        if (err)
        {
            // console.log(err);
            res.status(500).json(
                {
                    dbpediauri
                }
            );
        }
        else
        {
            var position;
            var count = 0;
            for (var i = 0; i < results.length; i++)
            {
                if (results[i] !== undefined && results[i].results[0] != null)
                {
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
                    console.log("searched word: " + dbpediaresults[i].words);

                    console.log("nc value: " + dbpediaresults[i].score);
                    console.log("URI: " + results[i].results[0].uri[0]);
                    console.log("label: " + results[i].results[0].prefixedName[0]);
                    console.log("lov score: " + results[i].results[0].score);
                    console.log("lov vocabulary: " + results[i].results[0]["vocabulary.prefix"][0]);
                    console.log("highlight 1 : " + results[i].results[0].highlight);
                    // var ret = results[i].results[position].prefixedName[0].toString().replace(results[i].results[position]["vocabulary.prefix"][0].toString(), "");
                    // console.log("highlight: " + ret);
                    var lovlabel;
                    var lov_highlight;
                    if (Object.values(results[i].results[0].highlight)[0] != undefined)
                    {
                        lovlabel = striptags(Object.values(results[i].results[0].highlight)[0].toString());
                    }
                    else
                    {
                        lovlabel = "";
                    }
                    if (Object.values(results[i].results[0].highlight)[1] != undefined)
                    {
                        lov_highlight = striptags(Object.values(results[i].results[0].highlight)[1].toString());
                    }
                    else
                    {
                        lov_highlight = "";
                    }
                    dbpediauri.result.push({
                        searchterm: dbpediaresults[i].words,
                        score: dbpediaresults[i].score,
                        lovscore: results[i].results[0].score,
                        lovvocabulary: results[i].results[0]["vocabulary.prefix"][0],
                        lovuri: results[i].results[0].uri[0],
                        lovlabel: lovlabel,
                        lov_highlight: lov_highlight,
                        lov_label_and_highlight: Object.values(results[i].results[0].highlight)[0],
                        dbpedialabel: "",
                        dbpediauri: "",
                        dbpediadescription: ""
                    });
                }
                else
                {
                    dbpediauri.result.push({
                        searchterm: dbpediaresults[i].words,
                        score: dbpediaresults[i].score,
                        error: "undefined term in lov"
                    });
                }
            }

            async.mapSeries(dbpediaresults, searchdb, function (err, results2)
            {
                if (err)
                {
                    // console.log(err);
                    res.status(500).json(
                        {
                            dbpediauri
                        }
                    );
                }
                else
                {
                    for (var i = 0; i < results2.length; i++)
                    {
                        if (results2[i] !== undefined && results2[i].results[0] != null)
                        {
                            position = 0;
                            let similar = 0;
                            for (let x = 0; x < results2[i].results.length; x++)
                            {
                                let current = stringSimilarity.compareTwoStrings(dbpediaresults[i].words, results2[i].results[x].label);
                                if (current > similar)
                                {
                                    similar = Number(current);
                                    position = x;
                                }
                            }
                            console.log("searched word: " + dbpediaresults[i].words);
                            console.log("nc value: " + dbpediaresults[i].score);
                            console.log("label: " + results2[i].results[position].label);
                            console.log("description: " + results2[i].results[position].description);
                            dbpediauri.result[i].dbpedialabel = results2[i].results[position].label;
                            dbpediauri.result[i].dbpediauri = results2[i].results[position].uri;
                            dbpediauri.result[i].dbpediadescription = results2[i].results[position].description;
                            console.log(dbpediauri.result[i]);
                        }
                        /*
                        else
                        {
                            // console.log("results for word : " + dbpediaresults[i].words + " undefined");
                            dbpediauri.result.push({
                                searchterm: dbpediaresults[i].words,
                                score: dbpediaresults[i].score,
                                error: "undefined term in dbpedia"
                            });
                        }*/
                    }
                    res.status(200).json(
                        {
                            dbpediauri
                        }
                    );
                }
            });
        }
    });
};

exports.dbpediaproperties = function (req, res)
{
    req.setTimeout(2500000);
    var search = function (lookup, cb)
    {
        lookup.label = lookup.label.replace(/\s/g, "_");
        /*
              const query = "select distinct ?property {\n" +
          "  { dbr:" + lookup.label + " ?property ?o }\n" +
          "  union\n" +
          "  { ?s ?property dbr:" + lookup.label + " }\n" +
          "\n" +
          "  filter not exists { ?property rdfs:label ?label }\n" +
          "}";*/
        const query = "select distinct ?property ?label {\n" +
          "  { <" + lookup.uri + "> ?property ?o }\n" +
          "\n" +
          "  optional { \n" +
          "    ?property a owl:DatatypeProperty rdfs:label ?label .\n" +
          "    filter langMatches(lang(?label), 'en')\n" +
          "  }\n" +
          "}";
        dps
            .client()
            .query(query)
            .asJson()
            .then(function (r)
            {
                cb(null, r);
            })
            .catch(function (err)
            {
                console.log(lookup.label + " : " + err);
                cb(null);
            });
    };

    var dbpediaconcepts = {
        concepts: []
    };
    for (var i = 0; i < req.body.concepts.length; i++)
    {
        if (!req.body.concepts[i].hasOwnProperty("error"))
        {
            dbpediaconcepts.concepts.push(req.body.concepts[i]);
        }
    }
    async.mapSeries(dbpediaconcepts.concepts, search, function (err, results)
    {
        var dbpediaproperties = {
            result: []
        };
        if (err)
        {
            // console.log(err);
            res.status(500).json(
                {
                    dbpediaproperties
                }
            );
        }
        else
        {
            var j;
            var h;
            for (var i = 0; i < results.length; i++)
            {
                if (results[i] !== undefined)
                {
                    if (dbpediaproperties.result.length === 0)
                    {
                        for (j = 0; j < results[i].results.bindings.length; j++)
                        {
                            dbpediaproperties.result.push({property: results[i].results.bindings[j].property.value, frequency: Number(dbpediaconcepts.concepts[i].score)});
                        }
                    }
                    else
                    {
                        // console.log(results[i].results.bindings[0].property.value);
                        for (j = 0; j < results[i].results.bindings.length; j++)
                        {
                            for (h = 0; h < dbpediaproperties.result.length; h++)
                            {
                                if (dbpediaproperties.result[h].property === results[i].results.bindings[j].property.value)
                                {
                                    dbpediaproperties.result[h].frequency = dbpediaproperties.result[h].frequency * dbpediaconcepts.concepts[i].score;
                                    break;
                                }
                            }
                            if (h === dbpediaproperties.result.length)
                            {
                                dbpediaproperties.result.push({property: results[i].results.bindings[j].property.value, frequency: Number(dbpediaconcepts.concepts[i].score)});
                            }
                        }
                    }
                }
                else
                {
                    /* // console.log("results for word : " + dbpediaresults[i].words + " undefined");
                    dbpediaproperties.result.push({
                        searchterm: dbpediaconcepts[i],
                        error: "failed to extract properties"
                    });*/
                }
            }
            dbpediaproperties.result.sort(function (a, b)
            {
                return b.frequency - a.frequency;
            });

            res.status(200).json(
                {
                    dbpediaproperties
                }
            );
        }
    });
};
/*exports.my = function (req, res)
{
    let viewVars = {
    // title: "My projects"
    };

    Project.findByCreatorOrContributor(req.user.uri, function (err, projects)
    {
        if (isNull(err) && !isNull(projects))
        {
            let acceptsHTML = req.accepts("html");
            const acceptsJSON = req.accepts("json");

            if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
            {
                res.json(
                    {
                        projects: projects
                    }
                );
            }
            else
            {
                viewVars = DbConnection.paginate(req,
                    viewVars
                );

                viewVars.projects = projects;
                res.render("keywords/my",
                    viewVars
                );
            }
        }
        else
        {
            viewVars.projects = [];
            viewVars.info_messages = ["You have not created any projects"];
            res.render("projects/my",
                viewVars
            );
        }
    });
};*/
exports.clustering = function (rec, res)
{

};

exports.text2owl = function (rec, res)
{

};
