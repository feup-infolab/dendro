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
    annotators: "tokenize,ssplit,pos,ner",
    "ssplit.isOneSentence": "false"
});
const pipeline = new corenlp.Pipeline(props, "English", connector);

let doc;

var request = require("request");
var baseRequest = request.defaults({
    headers: {
        Accept: "application/json"
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

    var my_corpus = new tm.Corpus([]);
    my_corpus.addDoc(req.body.text);
    // my_corpus.clean();
    my_corpus.toLower();
    // my_corpus.removeWords(tm.STOPWORDS.EN);
    // sent = new coreNLP.simple.Sentence(rec.body.text);
    doc = new coreNLP.simple.Document(my_corpus.documents[0]);
    pipeline.annotate(doc)
        .then(doc =>
        {
            const sent = doc.toJSON();
            // console.log(sent);
            // sent.parse();
            // console.log(coreNLP.util.Tree.fromDocument(sent).dump());
            // var output = JSON.parse(JSON.stringify(sent)).tokens;
            var output = [];
            // console.log(JSON.parse(JSON.stringify(sent.sentences[0])).tokens);
            // console.log(output);
            // console.log(sent.text);
            var comparision;
            for (var i = 0; i < sent.sentences.length; i++)
            {
                for (var j = 0; j < JSON.parse(JSON.stringify(sent.sentences[i])).tokens.length; j++)
                {
                    comparision = JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word;
                    if (comparision.indexOf("www") + 1 || comparision.indexOf("http") + 1 || comparision.indexOf("@") + 1 || hasNumber(comparision))
                    {
                    // console.log("contain numbers or address " + JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word);
                    }
                    else
                    {
                        output.push({word: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word, pos: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].pos, lemma: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].lemma});
                    }
                    // if (JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word.indexOf("www") + 1 || JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word.indexOf("http") + 1 || JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word.indexOf("@") + 1 || hasNumber(JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word))
                    // {
                    //     // console.log("contain numbers or address " + JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word);
                    // }
                    // else
                    // {
                    //     output.push({word: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word, pos: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].pos, lemma: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].lemma});
                    // }
                }
            }
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
                    result
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
    var nounphrase = function (text, re)
    {
        /*
      1. Noun+ Noun,
      2. (Adj | Noun)+ Noun,
      3. ((Adj | Noun)+ | ((Adj | Noun)* (NounPrep)?)(Adj| Noun)* ) Noun
      */
        var multiterm = [];
        var current_word = "";
        // console.log(text);
        // console.log(text.length);
        for (var index = 0; index < text.length; index++)
        {
            if (text[index].pos.charAt(0) === "N")
            {
                current_word = text[index].word;
                for (var index2 = index + 1; index2 < text.length; index2++)
                {
                    if (text[index2].pos.charAt(0) === "N")
                    {
                        current_word += (" " + text[index2].lemma);
                        multiterm.push(current_word);
                    }
                    else if (index2 === index + 1)
                    {
                        break;
                    }
                    else
                    {
                        multiterm.push(current_word);
                        break;
                    }
                }
            }
        }
        const result = [...new Set(multiterm.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
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
                console.log("result: " + result[0].path);
                console.log("text: " + text);
                var texti = JSON.parse(text);
                console.log("texti: " + texti.text);
                // var results = JSON.parse(texti.text).result;
                console.log("text length: " + texti.text.length);
                var results = [];
                var documents = [];
                if (texti.text.length > 1)
                {
                    for (var xx = 0; xx < texti.text.length; xx++)
                    {
                        // console.log(JSON.parse(texti.text[xx]).result);
                        results.push(JSON.parse(texti.text[xx]).result);
                    }
                    for (var yy = 0; yy < texti.documents.length; yy++)
                    // documents.push(texti.documents);
                    {
                        // console.log(texti.documents[yy]);
                        documents.push(texti.documents[yy]);
                    }
                }
                else
                {
                    results.push(JSON.parse(texti.text).result);
                    documents.push(texti.documents);
                    // console.log(results);
                    // console.log(documents);
                }
                for (var h = 0; h < results.length; h++)
                {
                    console.log(results[h]);
                }

                // console.log("documents " + documents);
                if (isNull(err))
                {
                    // console.log("textero" + text);
                    var TfIdf = natural.TfIdf;
                    var tfidf = new TfIdf();
                    var posnoums = [];
                    var score = [];
                    var out = [];
                    var values = [];
                    // out = nounphrase(results, null);
                    // cvalue(out, documents, values);
                    var i = 0;
                    if (texti.text.length > 1)
                    {
                        for (i = 0; i < results.length; i++)
                        {
                            for (var j = 0; j < results[i].length; j++)
                            {
                                if (results[i][j].pos === "NN" || results[i][j].pos === "NNS" || results[i][j].pos === "NNP" || results[i][j].pos === "NNPS")
                                {
                                    posnoums.push(results[i][j].lemma);
                                }
                            }
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
                    const posnoumssimple = [...new Set(posnoums.map(obj => JSON.stringify(obj)))]
                        .map(str => JSON.parse(str));
                    // console.log(rec.body.documents);
                    for (var a = 0; a < documents.length; a++)
                    {
                        // console.log("a :" + a);
                        // console.log("documents " + documents[a]);
                        if (texti.text.length > 1)
                        {
                            tfidf.addDocument(documents[a]);
                        }
                        else
                        {
                            tfidf.addDocument(documents[a][0]);
                        }
                    }

                    for (var p = 0; p < posnoumssimple.length; p++)
                    {
                        tfidf.tfidfs(posnoumssimple[p], function (i, measure)
                        {
                            // console.log("word " + posnoums[p] + " in document #" + i + " has a TF-IDF value of " + measure);
                            score.push(measure);
                        });
                    }
                    var sum = score.reduce((a, b) => a + b);
                    var avg = sum / score.length;
                    var dbpediaterms = {
                        keywords: []
                    };
                    for (var index = 0; index < posnoumssimple.length; index++)
                    {
                        if (score[index] > parseFloat((avg)))
                        {
                            // console.log(dbsearch[i]);
                            dbpediaterms.keywords.push({
                                words: posnoumssimple[index],
                                measures: score[index]
                            });
                        }
                    }
                    /* for (var j = 0; j < posnoums.length; j++)
                  {
                      console.log("noun: " + posnoums[j] + " score: " + score[j]);
                  }*/

                    res.json(
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

var search = function (lookup, cb)
{
    console.log("search : " + lookup.words);
    baseRequest("http://lookup.dbpedia.org/api/search/PrefixSearch?QueryClass=&MaxHits=5&QueryString=" + lookup.words, function getResponse (error, response, body)
    {
        if (!error && response.statusCode === 200)
        {
            // console.log(body);
            cb(null, body);
        }
        else
        {
            console.log("error: " + error);
            console.log("status code: " + response.statusCode);
            cb(error);
        }
    });
};

exports.dbpedialookup = function (rec, res)
{
    // var dbsearch = JSON.parse(JSON.parse(JSON.stringify(rec.body.keywords))).words;
    // var scores = JSON.parse(JSON.parse(JSON.stringify(rec.body.keywords))).measures;
    // console.log(JSON.parse(rec.body.keywords).dbpediaterms.keywords[0].words);
    var dbpediaresults = JSON.parse(rec.body.keywords).dbpediaterms.keywords;
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

    var dbpediauri = {
        result: []
    };
    async.map(dbpediaresults, search, function (err, results)
    {
        if (err)
        {
            console.log(err);
        }
        else
        {
            for (var i = 0; i < results.length; i++)
            {
                if (results[i] !== undefined)
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
                    console.log("results for word : " + dbpediaresults[i].words + " undefined");
                    dbpediauri.result.push({
                        searchterm: dbpediaresults[i].words,
                        error: "undefined term in dbpedia"
                    });
                }
            }
            res.json(
                {
                    dbpediauri
                }
            );
        }
    });
};

exports.clustering = function (rec, res)
{

};

exports.textowl = function (rec, res)
{

};
