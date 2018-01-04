require("babel-polyfill");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Uploader = require(Pathfinder.absPathInSrcFolder("/utils/uploader.js")).Uploader;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

var async = require("async");
var natural = require("natural");
var tm = require("text-miner");

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
/*
exports.loadfiles = function (rec, res)
{
    res.json(
        {
            return : "return"
        }
    );
};
*/
exports.preprocessing = function (req, res)
{
    function hasNumber (myString)
    {
        return /\d/.test(myString);
    }

    function replaceAll (str, find, replace)
    {
        // console.log("replacing: " + find + " for " + replace);
        return str.replace(new RegExp("\\b" + find + "\\b", "gi"), replace);
    }
    var my_corpus = new tm.Corpus([]);
    // my_corpus.clean();
    my_corpus.addDoc(req.body.text);
    // my_corpus.toLower();
    // my_corpus.removeWords(tm.STOPWORDS.EN);
    // sent = new coreNLP.simple.Sentence(rec.body.text);
    doc = new coreNLP.simple.Document(my_corpus.documents[0]);
    pipeline.annotate(doc)
        .then(doc =>
        {
            const sent = doc.toJSON();
            // console.log(sent);
            var text = sent.text;
            // console.log(sent);
            // console.log("text: " + text);
            // sent.parse();
            // console.log(coreNLP.util.Tree.fromDocument(sent).dump());
            // var output = JSON.parse(JSON.stringify(sent)).tokens;
            var output = [];
            // console.log(JSON.parse(JSON.stringify(sent.sentences[0])).tokens);
            // console.log(output);
            // console.log(sent.text);
            var comparision;
            var current_word;
            var nounphrase = [];
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
                            sentences.push(comparision.lemma);
                        }
                        // console.log("word: " + comparision.word + " pos: " + comparision.pos); // + " ner: " + comparision.ner + " lemma: " + comparision.lemma);
                        if (comparision.lemma.toString().length > 2)
                        {
                            output.push({word: comparision.word, pos: comparision.pos, lemma: comparision.lemma.toString()});
                        }
                        if (comparision.pos.charAt(0) === "N")
                        {
                            if (comparision.lemma.toString().length < 3)
                            {
                                // console.log(comparision.word);
                            }
                            else
                            {
                                current_word = comparision.lemma;
                                for (var index2 = j + 1; index2 < JSON.parse(JSON.stringify(sent.sentences[i])).tokens.length; index2++)
                                {
                                    comparision = JSON.parse(JSON.stringify(sent.sentences[i])).tokens[index2];
                                    if (comparision.pos.charAt(0) === "N")
                                    {
                                        if (comparision.lemma.toString().length < 3)
                                        {
                                            break;
                                        }
                                        current_word += (" " + comparision.lemma);
                                        nounphrase.push(current_word);
                                    }
                                    else if (index2 === (j + 1))
                                    {
                                        break;
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
            }
            nounphrase = [...new Set(nounphrase.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));
            output = [...new Set(output.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));
            /*
        var processed = {};
        output.forEach(function (item)
        {
            var value = processed[item.word] = processed[item.word] || {};
            value.pos = item.pos;
            value.lemma = item.lemma;
        });*/
            /* const result = [...new Set(output.map(obj => JSON.stringify(obj)))]
                .map(str => JSON.parse(str));*/
            const result = output;
            res.json(
                {
                    text: sentences.join(" "),
                    result,
                    nounphrase
                }
            );
        })
        .catch(err =>
        {
            console.log("err", err);
        });
};

exports.termextraction = function (req, res)
{
    var nounphrase = function (text, nouns, res)
    {
        /*
      1. Noun+ Noun,
      2. (Adj | Noun)+ Noun,
      3. ((Adj | Noun)+ | ((Adj | Noun)* (NounPrep)?)(Adj| Noun)* ) Noun
      */
        var multiterm = [];
        var tokenize;
        var current_word = "";
        // console.log(text);
        // console.log(text.length);
        // console.log("nouns : " + nouns);
        for (var doc = 0; doc < text.length; doc++)
        {
            tokenize = text[doc].split(" ");
            // console.log("tokenize  " + tokenize);
            for (var index = 0; index < tokenize.length; index++)
            {
                if (nouns.indexOf(tokenize[index]) > -1)
                {
                    current_word = tokenize[index];
                    for (var index2 = index + 1; index2 < tokenize.length; index2++)
                    {
                        if (nouns.indexOf(tokenize[index2]) > -1)
                        {
                            current_word += (" " + tokenize[index2]);
                            multiterm.push(current_word);
                        }
                        else if (index2 === index + 1)
                        {
                            break;
                        }
                        else
                        {
                            break;
                        }
                    }
                }
                // console.log(multiterm);
            }
            // console.log(multiterm.length);
        }
        const result = [...new Set(multiterm.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
        // console.log(result);
        // console.log(result.length);
        // console.log(multiterm);
        // console.log(result);
        return result;
    };

    var occurences = function (string, subString, allowOverlapping)
    {
        string = String(string);
        subString = String(subString);
        if (subString.length <= 0) return (string.length + 1);

        var n = 0,
            pos = 0,
            step = allowOverlapping ? 1 : subString.length;

        while (true)
        {
            pos = string.indexOf(subString, pos);
            if (pos >= 0)
            {
                ++n;
                pos += step;
            }
            else break;
        }
        return n;
    };
    function count (list, x)
    {
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
    var cvalue = function (input, corpus, output)
    {
        for (var j = 0; j < input.length; j++)
        {
            // console.log(corpus.toString());
            // console.log(input[j].toString());
            // console.log(occurences(corpus.toString(), input[j].toString()));
            // console.log(input[j] + " : " + count(input, input[j]));
        }
        /*

        double log_2_lenD = (Math.log((double)len)/Math.log((double)2));
        double freqD = (double) freq;
        double invUniqNestersD = 1D / (double) uniqNesters;
        double freqNestedD = (double) freqNested;

        if (uniqNesters == 0) {
            return log_2_lenD * freqD;
        } else {
            return log_2_lenD * (freqD - invUniqNestersD * freqNestedD);

         */
    };

    const uploader = new Uploader();
    uploader.handleUpload(req, res, function (err, result)
    {
        const fs = require("fs");
        if (isNull(result) || !(result instanceof Array) || result.length !== 1)
        {
            res.status(400).json(
                {
                    result: "error",
                    message: "Unable to process document upload for term extraction."
                }
            );
        }
        else
        {
            fs.readFile(result[0].path, "utf8", function (err, text)
            {
                function WordCount (str)
                {
                    return str.split(" ").length;
                }
                // console.log("result: " + result[0].path);
                // console.log("text: " + text);
                var texti = JSON.parse(text);
                // console.log("texti: " + texti.text);
                // var results = JSON.parse(texti.text).result;
                // console.log("text length: " + texti.text.length);
                var results = [];
                var documents = [];
                var my_corpus = new tm.Corpus([]);
                var documentlength = [];
                var nounphrase = [];
                if (texti.text.length > 1)
                {
                    for (var xx = 0; xx < texti.text.length; xx++)
                    {
                        // console.log(JSON.parse(texti.text[xx]).result);
                        results.push(JSON.parse(texti.text[xx]).result);
                        nounphrase.push(JSON.parse(texti.text[xx]).nounphrase);
                    }
                    for (var yy = 0; yy < texti.documents.length; yy++)
                    // documents.push(texti.documents);
                    {
                        // console.log(texti.documents[yy]);
                        // console.log(texti.documents[yy].toString().length);
                        // console.log(texti.documents[yy].toString());
                        my_corpus = new tm.Corpus([]);
                        my_corpus.addDoc(texti.documents[yy].toString());
                        // my_corpus.toLower();
                        // my_corpus.removeWords(tm.STOPWORDS.EN);
                        // console.log(my_corpus.documents[yy].length);
                        // console.log(my_corpus.documents[yy]);
                        documents.push(my_corpus.documents[0]);
                        documentlength.push(WordCount(my_corpus.documents[0]));
                        // console.log(my_corpus.documents[0]);
                    }
                }
                else
                {
                    results.push(JSON.parse(texti.text).result);
                    nounphrase.push(JSON.parse(texti.text).nounphrase);
                    // console.log(texti.documents.toString().length);
                    // console.log(texti.documents.toString());
                    my_corpus.addDoc(texti.documents.toString());
                    // my_corpus.toLower();
                    // my_corpus.removeWords(tm.STOPWORDS.EN);
                    // console.log(my_corpus.documents[0].length);
                    // console.log(my_corpus.documents[0]);
                    documents.push(my_corpus.documents[0]);
                    // console.log(results);
                    // console.log(documents);
                }
                // for (var h = 0; h < results.length; h++)
                // {
                //     console.log(results[h]);
                // }
                if (isNull(err))
                {
                    // console.log("textero" + text);
                    var TfIdf = natural.TfIdf;
                    var tfidf = new TfIdf();
                    var posnoums = [];
                    var posnoumsfinal = [];
                    var score = [];
                    var currentscore = [];
                    var nounphrasefinal = [];
                    var out = [];
                    var values = [];
                    // cvalue(out, documents, values);
                    var i = 0;
                    var j = 0;
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
                    if (texti.text.length > 1)
                    {
                        for (i = 0; i < results.length; i++)
                        {
                            for (j = 0; j < results[i].length; j++)
                            {
                                if (results[i][j].pos === "NN" || results[i][j].pos === "NNS" || results[i][j].pos === "NNP" || results[i][j].pos === "NNPS")
                                {
                                    posnoums.push(results[i][j].lemma);
                                }
                            }
                            // console.log("document size " + documentlength[i]);
                        }
                        for (i = 0; i < nounphrase.length; i++)
                        {
                            for (j = 0; j < nounphrase[i].length; j++)
                            {
                                nounphrasefinal.push(nounphrase[i][j]);
                            }
                            // console.log("document size " + documentlength[i]);
                        }
                    }
                    else
                    {
                        for (i = 0; i < results[0].length; i++)
                        {
                            if (results[0][i].pos === "NN" || results[0][i].pos === "NNS" || results[0][i].pos === "NNP" || results[0][i].pos === "NNPS")
                            {
                                posnoums.push(results[0][i].lemma);
                            }
                        }
                    }
                    var sum = documentlength.reduce((x, y) => x + y);
                    // console.log("pos noun " + posnoums.length);
                    const posnoumssimple = [...new Set(posnoums.map(obj => JSON.stringify(obj)))]
                        .map(str => JSON.parse(str));
                    const nounphrasesimple = [...new Set(nounphrasefinal.map(obj => JSON.stringify(obj)))]
                        .map(str => JSON.parse(str));
                    // out = nounphrase(documents, posnoumssimple, null);

                    // console.log(rec.body.documents);
                    // console.log("posnoumssimple " + posnoumssimple);
                    for (var a = 0; a < documents.length; a++)
                    {
                        if (texti.text.length > 1)
                        {
                            tfidf.addDocument(documents[a]);
                        }
                        else
                        {
                            tfidf.addDocument(documents[a][0]);
                        }
                    }
                    var index;
                    var tfidfterms = {scores: []};
                    var showedalready = [];
                    var showedalreadyscore = [];
                    var pos = [];
                    var doc = [];

                    for (var b = 0; b < documents.length; b++)
                    {
                        index = 0;

                        tfidf.listTerms(b).forEach(function (item)
                        {
                            // if (index < (documentlength[b] * 0.1))
                            if (index < documentlength[b] * 0.01)
                            {
                                if (item.term.toString() === "aerodynamic" || item.term.toString() === "drag" || item.term.toString() === "coefficient" || item.term.toString() === "air" || item.term.toString() === "density" || item.term.toString() === "controller" || item.term.toString() === "efficiency" || item.term.toString() === "drive" || item.term.toString() === "driving" || item.term.toString() === "cycle" || item.term.toString() === "gear" || item.term.toString() === "ratio" || item.term.toString() === "gravitational" || item.term.toString() === "acceleration" || item.term.toString() === "road" || item.term.toString() === "surface" || item.term.toString() === "coefficient" || item.term.toString() === "tire" || item.term.toString() === "radius" || item.term.toString() === "vehicle" || item.term.toString() === "frontal" || item.term.toString() === "area" || item.term.toString() === "mass" || item.term.toString() === "model")
                                {
                                    if (showedalready.indexOf(item.term.toString()) > -1)
                                    {
                                        if (showedalreadyscore[showedalready.indexOf(item.term.toString())] < item.tfidf)
                                        {
                                            // showedalready[showedalready.indexOf(item.term.toString())] = item.term.toString();
                                            showedalreadyscore[showedalready.indexOf(item.term.toString())] = item.tfidf;
                                            pos[showedalready.indexOf(item.term.toString())] = index;
                                            doc[showedalready.indexOf(item.term.toString())] = b;
                                            // console.log("new value");
                                            // console.log(pos[showedalready.indexOf(item.term.toString())]);
                                            // console.log("document: " + b + " term: " + item.term + " item score: " + item.tfidf + " position: " + index);
                                        }
                                    }
                                    else
                                    {
                                        showedalready.push(item.term.toString());
                                        showedalreadyscore.push(item.tfidf);
                                        pos.push(index);
                                        doc.push(b);
                                        // console.log("document: " + b + " term: " + item.term + " item score: " + item.tfidf + " position: " + index);
                                    }
                                }
                                // console.log(b + " " + item.term + ": " + item.tfidf);
                                // console.log(index);
                                // console.log(documentlength[b].length);

                                index++;
                                tfidfterms.scores.push({term: item.term, score: item.tfidf});
                            }
                        });
                    }

                    tfidfterms.scores.sort(function (a, b)
                    {
                        return parseFloat(b.score) - parseFloat(a.score);
                    });
                    var auxiliarname = [];
                    var auxiliarscore = [];

                    for (i = 0; i < tfidfterms.scores.length; i++)
                    {
                        // console.log(tfidfterms.scores[i].term);
                        if (posnoumssimple.indexOf(tfidfterms.scores[i].term) > -1)
                        {
                            if (auxiliarname.indexOf(tfidfterms.scores[i].term) > -1)
                            {
                                /*
                                if (tfidfterms.scores[i].score > auxiliarscore[i])
                                {
                                    updateVal(tfidfterms.scores[i].term, tfidfterms.scores[i].score);
                                    console.log("updated friend");
                                }
                                */

                            }
                            else
                            {
                                dbpediaterms.keywords.push({
                                    words: tfidfterms.scores[i].term,
                                    score: tfidfterms.scores[i].score
                                });
                                auxiliarname.push(tfidfterms.scores[i].term);
                                auxiliarscore.push(tfidfterms.scores[i].score);
                            }
                        }
                        else
                        {
                        // Not in the array
                            // console.log("word: " + tfidfterms.scores[i].term + " not a name");
                        }
                    }
                    // console.log(dbpediaterms);
                    // console.log("length");
                    // console.log(showedalreadyscore.length);
                    // console.log(showedalready.length);
                    // console.log(pos.length);
                    for (var sa = 0; sa < showedalready.length; sa++)
                    {
                        // console.log(showedalready[sa] + " " + showedalreadyscore[sa] + " doc: " + (doc[sa] + 1) + " pos " + (pos[sa] + 1));
                    }
                    // console.log(dbpediaterms.keywords);
                    var p = 0;
                    for (p = 0; p < posnoumssimple.length; p++)
                    {
                        currentscore = [];
                        tfidf.tfidfs(posnoumssimple[p], function (i, measure)
                        {
                            // console.log("word " + posnoums[p] + " in document #" + i + " has a TF-IDF value of " + measure);
                            currentscore.push(measure);
                        });
                        score.push({word: posnoumssimple[p], score: currentscore});
                    }
                    var tfidfnp = {scores: []};

                    // console.log("Nounphrase simple: " + nounphrasesimple.length);
                    for (p = 0; p < nounphrasesimple.length; p++)
                    {
                        currentscore = [];
                        // console.log(p + " " + nounphrasefinal[p]);
                        tfidf.tfidfs(nounphrasesimple[p], function (i, measure)
                        {
                            currentscore.push(measure);
                        });
                        tfidfnp.scores.push({term: nounphrasesimple[p], score: currentscore});
                    }
                    tfidfnp.scores.sort(function (a, b)
                    {
                        return parseFloat(b.score) - parseFloat(a.score);
                    });
                    for (i = 0; i < tfidfnp.scores.length; i++)
                    {
                    // console.log(tfidfterms.scores[i].term);
                        if (tfidfnp.scores[i].term.toLowerCase() === "air density" || tfidfnp.scores[i].term.toLowerCase() === "controller efficiency" || tfidfnp.scores[i].term.toLowerCase() === "gear ratio" || tfidfnp.scores[i].term.toLowerCase() === "gravitational acceleration" || tfidfnp.scores[i].term.toLowerCase() === "road surface coefficient" || tfidfnp.scores[i].term.toLowerCase() === "tire radius" || tfidfnp.scores[i].term.toLowerCase() === "vehicle frontal area" || tfidfnp.scores[i].term.toLowerCase() === "vehicle mass" || tfidfnp.scores[i].term.toLowerCase() === "vehicle model")
                        {
                            // console.log(tfidfnp.scores[i].term + " " + i + " score: " + tfidfnp.scores[i].score[0]);
                        }
                    }
                    var auxiliaryscorearray = [];
                    var auxiliaryscore = 0;
                    for (var oso = 0; oso < tfidfnp.scores.length; oso++)
                    {
                        auxiliaryscore = 0;
                        for (i = 0; i < tfidfnp.scores[oso].score.length; i++)
                        {
                            auxiliaryscore += tfidfnp.scores[oso].score[i];
                        }
                        auxiliaryscorearray.push((auxiliaryscore / 5));
                    }
                    var sorted = [];
                    for (i = 0; i < tfidfnp.scores.length; i++)
                    {
                    // console.log(tfidfterms.scores[i].term);
                        if (tfidfnp.scores[i].term.toLowerCase() === "air density" || tfidfnp.scores[i].term.toLowerCase() === "controller efficiency" || tfidfnp.scores[i].term.toLowerCase() === "gear ratio" || tfidfnp.scores[i].term.toLowerCase() === "gravitational acceleration" || tfidfnp.scores[i].term.toLowerCase() === "road surface coefficient" || tfidfnp.scores[i].term.toLowerCase() === "tire radius" || tfidfnp.scores[i].term.toLowerCase() === "vehicle frontal area" || tfidfnp.scores[i].term.toLowerCase() === "vehicle mass" || tfidfnp.scores[i].term.toLowerCase() === "vehicle model")
                        {
                            // console.log(tfidfnp.scores[i].term + " " + i + " score: " + auxiliaryscorearray[i]);
                        }
                      sorted.push({term: tfidfnp.scores[i].term, score: auxiliaryscorearray[i]});
                    }
                    sorted.sort(function (a, b)
                    {
                        return parseFloat(b.score) - parseFloat(a.score);
                    });
                    for (i = 0; i < sorted.length; i++)
                    {
                    // console.log(tfidfterms.scores[i].term);
                        if (sorted[i].term.toLowerCase() === "air density" || sorted[i].term.toLowerCase() === "controller efficiency" || sorted[i].term.toLowerCase() === "gear ratio" || sorted[i].term.toLowerCase() === "gravitational acceleration" || sorted[i].term.toLowerCase() === "road surface coefficient" || sorted[i].term.toLowerCase() === "tire radius" || sorted[i].term.toLowerCase() === "vehicle frontal area" || sorted[i].term.toLowerCase() === "vehicle mass" || sorted[i].term.toLowerCase() === "vehicle model")
                        {
                            console.log(sorted[i].term.toLowerCase() + " " + i + " score: " + sorted[i].score);
                        }
                    }
                    /* var auxiliaryscorearray = [];
                    var auxiliaryscore = 0;
                    for (var oso = 0; oso < score.length; oso++)
                    {
                        auxiliaryscore = 0;
                        for (i = 0; i < score[oso].score.length; i++)
                        {
                            auxiliaryscore += score[oso].score[i];
                        }
                        auxiliaryscorearray.push((auxiliaryscore / 5));
                    }
                    */
                    /*
                    dbpediaterms = {
                        keywords: []
                    };
                    for (index = 0; index < posnoumssimple.length; index++)
                    {
                        // console.log(dbsearch[i]);
                        dbpediaterms.keywords.push({
                            words: posnoumssimple[index],
                            score: auxiliaryscorearray[index]
                        });
                    }

                    dbpediaterms.keywords.sort(function (a, b)
                    {
                        return parseFloat(b.score) - parseFloat(a.score);
                    });

                    console.log(dbpediaterms);
*/
                    res.status(200).json(
                        {
                            dbpediaterms
                        }
                    );
                }
                else
                {
                    res.status(400).json(
                        {
                            result: "error",
                            message: "Unable to read uploaded file for term extraction.",
                            error: text
                        }
                    );
                }
            });
        }
    });
};

exports.dbpedialookup = function (req, res)
{
    var search = function (lookup, cb)
    {
        console.log("searching : " + lookup.words);
        baseRequest("http://lookup.dbpedia.org/api/search/PrefixSearch?QueryClass=&MaxHits=10&QueryString=" + lookup.words, function getResponse (error, response, body)
        // baseRequest("http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=&QueryString=" + lookup.words, function getResponse (error, response, body)
        {
            if (!error && response.statusCode === 200)
            {
                // console.log(body);
                cb(null, body);
            }
            else
            {
                // console.log("error: " + error);
                // console.log("status code: " + response.statusCode);
                cb(error);
            }
        });
    };
    // var dbsearch = JSON.parse(JSON.parse(JSON.stringify(rec.body.keywords))).words;
    // var scores = JSON.parse(JSON.parse(JSON.stringify(rec.body.keywords))).measures;
    // console.log(JSON.parse(rec.body.keywords).dbpediaterms.keywords[0].words);
    var dbpediaresults = JSON.parse(req.body.keywords).dbpediaterms.keywords;
    // var lookup = rec.body;
    /*
    var sum = scores.reduce(function (a, b)
    {
        return a + b;
    });
    var avg = sum / scores.length;
    var bbody;

    for (var i = 0; i < dbsearch.length; i++)
    {
        if (scores[i] > (avg + avg))
        {
            // console.log(dbsearch[i]);
            lookup.push(dbsearch[i]);
        }
    }
    */
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
            for (var i = 0; i < results.length; i++)
            {
                if (results[i] !== undefined && JSON.parse(results[i]).results[0] != null)
                {
                    console.log("searched word: " + dbpediaresults[i].words);
                    console.log("URI: " + JSON.parse(results[i]).results[0].uri);
                    console.log("label: " + JSON.parse(results[i]).results[0].label);
                    console.log("description: " + JSON.parse(results[i]).results[0].description);
                    dbpediauri.result.push({
                        searchterm: dbpediaresults[i].words,
                        uri: JSON.parse(results[i]).results[0].uri,
                        label: JSON.parse(results[i]).results[0].label,
                        description: JSON.parse(results[i]).results[0].description
                    });
                }
                else
                {
                    // console.log("results for word : " + dbpediaresults[i].words + " undefined");
                    dbpediauri.result.push({
                        searchterm: dbpediaresults[i].words,
                        error: "undefined term in dbpedia"
                    });
                }
            }
        }
        res.status(200).json(
            {
                dbpediauri
            }
        );
    });
};

exports.clustering = function (rec, res)
{

};

exports.textowl = function (rec, res)
{

};
