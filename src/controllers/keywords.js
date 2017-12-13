require("babel-polyfill");
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

exports.loadfiles = function (rec, res)
{
    res.json(
        {
            ola: "hello"
        }
    );
};
exports.preprocessing = function (rec, res)
{
    var my_corpus = new tm.Corpus([]);
    my_corpus.addDoc(rec.body.text);
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
            console.log(sent.text);
            for (var i = 0; i < sent.sentences.length; i++)
            {
                for (var j = 0; j < JSON.parse(JSON.stringify(sent.sentences[i])).tokens.length; j++)
                {
                    output.push({word: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].word, pos: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].pos, lemma: JSON.parse(JSON.stringify(sent.sentences[i])).tokens[j].lemma});
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

exports.termextraction = function (rec, res)
{
    var nounphrase = function (text, re)
    {
        /*
      1. Noun+ Noun,
      2. (Adj | Noun)+ Noun,
      3. ((Adj | Noun)+ | ((Adj | Noun)* (NounPrep)?)(Adj| Noun)* ) Noun
      */
        var multiterm = [];
        var current_word;
        for (var index = 0; index < text.length; index++)
        {
            if (text[index].pos.charAt(0) === "N")
            {
                current_word = "";
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

            console.log(text[index]);
        }
        const result = [...new Set(multiterm.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
        console.log(result);
        out = result;
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
            console.log(corpus.toString());
            console.log(input[j].toString());
            console.log(occurences(corpus.toString(), input[j].toString()));
            console.log(input[j] + " : " + count(input, input[j]));
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

    var TfIdf = natural.TfIdf;
    var tfidf = new TfIdf();
    var text = JSON.parse(rec.body.text).result;
    // console.log(text);
    var posnoums = [];
    var score = [];
    var out = [];
    var values = [];
    nounphrase(text, out);
    cvalue(out, rec.body.documents, values);
    for (var i = 0; i < text.length; i++)
    {
        if (text[i].pos === "NN" || text[i].pos === "NNS" || text[i].pos === "NNP" || text[i].pos === "NNPS")
        {
            posnoums.push(text[i].lemma);
        }
    }
    // console.log(rec.body.documents);
    tfidf.addDocument(rec.body.documents);

    for (var p = 0; p < posnoums.length; p++)
    {
        tfidf.tfidfs(posnoums[p], function (i, measure)
        {
            // console.log("word " + posnoums[p] + " in document #" + i + " has a TF-IDF value of " + measure);
            score.push(measure);
        });
    }
    /* for (var j = 0; j < posnoums.length; j++)
    {
        console.log("noun: " + posnoums[j] + " score: " + score[j]);
    }*/
    res.json(
        {
            words: posnoums, measures: score
        }
    );
};

var search = function (lookup, cb)
{
    baseRequest("http://lookup.dbpedia.org/api/search/PrefixSearch?QueryClass=&MaxHits=5&QueryString=" + lookup, function getResponse (error, response, body)
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
    var dbsearch = JSON.parse(JSON.parse(JSON.stringify(rec.body.keywords))).words;
    var scores = JSON.parse(JSON.parse(JSON.stringify(rec.body.keywords))).measures;
    var lookup = [];

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
    var dbpediaresults = {
        result: []
    };
    const lookup2 = [...new Set(lookup.map(obj => JSON.stringify(obj)))]
        .map(str => JSON.parse(str));

    async.map(lookup2, search, function (err, results)
    {
        if (err)
        {
            console.log(err);
        }
        else
        {
            for (var i = 0; i < results.length; i++)
            {
                console.log("searched word: " + lookup[i]);
                console.log("URI: " + JSON.parse(results[i]).results[0].uri);
                console.log("label: " + JSON.parse(results[i]).results[0].label);
                console.log("description: " + JSON.parse(results[i]).results[0].description);
                dbpediaresults.result.push({
                    uri: JSON.parse(results[i]).results[0].uri,
                    label: JSON.parse(results[i]).results[0].label,
                    description: JSON.parse(results[i]).results[0].description
                });
            }
            res.json(
                {
                    dbpediaresults
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
