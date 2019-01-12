require("babel-polyfill");

const rlequire = require("rlequire");
const async = require("async");
const _ = require("underscore");
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const stringSimilarity = require("string-similarity");
const stripTags = require("striptags");

const stopWords = require("stopwords").english;
const coreNlp = require("corenlp");
const coreNLP = coreNlp.default;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const props = new coreNlp.Properties({
    // annotators: "tokenize,ssplit,pos,ner"
    annotators: "tokenize,ssplit,pos,lemma"
});

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

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const connector = new coreNlp.ConnectorServer({
    dsn: Config.keywords_extraction.corenlp.server_address
});

const pipeline = new coreNlp.Pipeline(props, "English", connector);

module.exports.preProcessing = function (text, method, callback)
{
    if (isNull(text) || isNull(text.text) || typeof text.text !== "string" || text.text === "")
    {
        callback({
            statusCode: 200,
            method: method,
            text: null
        });
    }
    else
    {
        let nounPhrase = function (type, text)
        {
            /*
              1. Noun+ Noun,
              2. (Adj | Noun)+ Noun,
              3. ((Adj | Noun)+ | ((Adj | Noun)* (NounPrep)?)(Adj| Noun)* ) Noun
            */
            let multiTerm = [];
            let currentWord = "";
            let comparison;

            if (type === "nn")
            {
                for (let j = 0; j < text.length; j++)
                {
                    comparison = text[j];
                    if (comparison.pos().charAt(0) === "N" && /^[a-zA-Z\\-]+$/.test(comparison.lemma().toString()))
                    {
                        if (!(stopWords.indexOf(comparison.lemma().toLowerCase()) > -1 || comparison.lemma().length < 3))
                        {
                            currentWord = comparison.lemma();
                            for (let index2 = j + 1; index2 < text.length; index2++)
                            {
                                comparison = text[index2];
                                if (comparison.pos().charAt(0) === "N" && /^[a-zA-Z\\-]+$/.test(comparison.lemma().toString()))
                                {
                                    if (stopWords.indexOf(comparison.lemma().toLowerCase()) > -1 || comparison.lemma().length < 3)
                                    {
                                        // console.log(comparison.lemma().toString());
                                        break;
                                    }
                                    currentWord += (" " + comparison.lemma());
                                    multiTerm.push(currentWord.toLowerCase());
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
                    comparison = text[j];
                    if ((comparison.pos().charAt(0) === "N" || comparison.pos().charAt(0) === "J") && /^[a-zA-Z\\-]+$/.test(comparison.lemma().toString()))
                    {
                        if (!(stopWords.indexOf(comparison.lemma().toLowerCase()) > -1 || comparison.lemma().toString().length < 3))
                        {
                            currentWord = comparison.lemma();
                            for (let index2 = j + 1; index2 < text.length; index2++)
                            {
                                comparison = text[index2];
                                if (comparison.pos().charAt(0) === "N" && /^[a-zA-Z\\-]+$/.test(comparison.lemma().toString()))
                                {
                                    if (comparison.lemma().toString().length < 3 || stopWords.indexOf(comparison.lemma().toLowerCase()) > -1)
                                    {
                                        break;
                                    }
                                    currentWord += (" " + comparison.lemma());
                                    multiTerm.push(currentWord.toLowerCase());
                                }
                                else if (comparison.pos().charAt(0) === "J" && /^[a-zA-Z\\-]+$/.test(comparison.lemma().toString()))
                                {
                                    if (comparison.lemma().toString().length < 3 || stopWords.indexOf(comparison.lemma().toLowerCase()) > -1)
                                    {
                                        break;
                                    }
                                    if ((text[(index2 + 1)].pos().charAt(0) === "N" || text[(index2 + 1)].pos().charAt(0) === "J") && /^[a-zA-Z\\-]+$/.test(text[(index2 + 1)].lemma()))
                                    {
                                        currentWord += (" " + comparison.lemma());
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

            return multiTerm;
        };

        doc = new coreNLP.simple.Document(text.text);
        pipeline.annotate(doc)
            .then(doc =>
            {
                const sent = doc.toJSON();
                let output = [];
                let nounPhraseList = [];
                let sentences = [];
                for (let i = 0; i < sent.sentences.length; i++)
                {
                    for (let j = 0; j < sent.sentences[i].tokens().length; j++)
                    {
                        let comparison = sent.sentences[i].token(j);

                        if (!/^[a-zA-Z\\-]+$/.test(comparison.word().toString()) || comparison.word().indexOf("www") + 1 || comparison.word().indexOf("http") + 1 || comparison.word().indexOf("@") + 1)
                        {
                            sentences.push(comparison.word());
                        }
                        else
                        {
                            if (comparison.word() !== comparison.lemma())
                            {
                                sentences.push(comparison.lemma());
                            }
                            else
                            {
                                sentences.push(comparison.word());
                            }
                            if (comparison.lemma().length > 2)
                            {
                                output.push({
                                    word: comparison.word(),
                                    pos: comparison.pos(),
                                    lemma: comparison.lemma()
                                });
                            }
                        }
                    }
                    if (method === "CValueJJ")
                    {
                        let newNounPhrase = nounPhrase("jj", sent.sentences[i].tokens());
                        nounPhraseList = nounPhraseList.concat(newNounPhrase);
                    }
                    else if (method === "CValueNN")
                    {
                        let newNounPhrase = nounPhrase("jj", sent.sentences[i].tokens());
                        nounPhraseList = nounPhraseList.concat(newNounPhrase);
                    }
                }

                callback({
                    statusCode: 200,
                    method: method,
                    text: sentences.join(" "),
                    output: output,
                    nounPhraseList: nounPhraseList
                });
            })
            .catch(err =>
            {
                callback({
                    statusCode: 500,
                    method: method,
                    error: err
                });
            });
    }
};

module.exports.processExtract = function (req, res)
{
    if (isNull(req.body.text) || !(req.body.text instanceof Array))
    {
        return res.status(400).json({
            result: "error",
            message: "No text supplied for preprocessing, or the \"text\" field in the request body is not an Array. Does this file have any text content?"
        });
    }

    req.setTimeout(2500000);
    let process = function (method, text, cb)
    {
        module.exports.preProcessing(text, method, function (response)
        {
            if (response.statusCode === 200)
            {
                cb(null, response);
            }
            else
            {
                cb("error pre processing");
            }
        });
    };

    async.mapSeries(req.body.text, async.apply(process, req.body.method), function (err, results)
    {
        if (err)
        {
            // console.log(err);
            res.status(500).json(
                {
                    error: "error during text preProcessing"
                }
            );
        }
        else
        {
            req.body.preprocessingResults = _.filter(
                results,
                function(result){
                    return !isNull(result.text);
                });

            module.exports.termExtraction(req, res);
        }
    });
};

module.exports.termExtraction = function (req, res)
{
    if (isNull(req.body.text) || !(req.body.text instanceof Array))
    {
        return res.status(400).json({
            result: "error",
            message: "No text supplied for preprocessing, or the \"text\" field in the request body is not an Array. Does this file have any text content?"
        });
    }

    let removeExtraTerms = function (nounPhrases)
    {
        let nnf = {frequency: []};
        let contains = false;
        for (let i = 0; i < (nounPhrases.length - 1); i++)
        {
            contains = false;
            for (let j = 0; j < nounPhrases.length; j++)
            {
                if (tokenizer.tokenize(nounPhrases[i].word).length === tokenizer.tokenize(nounPhrases[j].word).length)
                {
                    if ((nounPhrases[j].word.indexOf(nounPhrases[i].word) > -1) && nounPhrases[i].word !== nounPhrases[j].word)
                    {
                        contains = true;
                        break;
                    }
                }
            }
            if (contains === false)
            {
                nnf.frequency.push({word: nounPhrases[i].word, cvalue: nounPhrases[i].cvalue});
            }
        }
        return nnf.frequency;
    };

    let yake = function (lookup, cb)
    {
        let headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
        };
        let dataString = "content=" + lookup;

        let options = {
            url: "https://boiling-castle-88317.herokuapp.com/yake/v2/extract_keywords?max_ngram_size=3&number_of_keywords=30",
            method: "POST",
            headers: headers,
            body: dataString
        };

        request(options, function (error, response, body)
        {
            if (!error && response.statusCode === 200)
            {
                cb(null, JSON.parse(body));
            }
            else
            {
                // console.log("status code: " + response.statusCode);
                cb(error);
            }
        });
    };

    function wordCount (str)
    {
        if (!isNull(str) && typeof str === "string" && str.split(" ") instanceof Array)
        {
            return str.split(" ").length;
        }
        else
        {
            return 0;
        }
    }

    function countOccurrences (str, value)
    {
        let regExp = new RegExp(value, "gi");
        return (str.match(regExp) || []).length;
    }

    let termhood = function (list)
    {
        let freq = 0;
        let finalList = list;
        for (let i = 0; i < list.length; i++)
        {
            freq = 0;
            if (list[i].nested === false)
            {
                finalList[i].termhood = list[i].frequency;
            }
            else
            {
                for (let j = 0; j < finalList[i].nestedTerms.length; j++)
                {
                    let nested = false;
                    for (let h = 0; h < j; h++)
                    {
                        if (finalList[i].nestedTerms[h].term.indexOf(finalList[i].nestedTerms[j].term) === 0)
                        {
                            nested = true;
                        }
                    }
                    if (nested === true)
                    {
                        freq -= finalList[i].nestedTerms[j].frequency;
                    }
                    else
                    {
                        freq += finalList[i].nestedTerms[j].frequency;
                    }
                }
                finalList[i].nestedFreq = freq;
            }
        }

        return finalList;
    };

    let isNested = function (list, nGrams)
    {
        let nestedList = list;
        let i;
        let j;
        for (i = 0; i < nestedList.length; i++)
        {
            if (tokenizer.tokenize(nestedList[i].word).length === nGrams)
            {
                nestedList[i].nested = false;
            }
            else
            {
                for (j = 0; j < nestedList.length; j++)
                {
                    if (nestedList[j].word.indexOf(nestedList[i].word) > -1)
                    {
                        if (nestedList[j].word !== nestedList[i].word)
                        {
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

    let cvalue = function (input, corpus, nGrams)
    {
        let words = {frequency: []};
        let i;
        // 1st para in async.each() is the array of items

        for (i = 0; i < input.length; i++)
        {
            let frequency = 0;
            for (let j = 0; j < corpus.length; j++)
            {
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
        }
        words.frequency = isNested(words.frequency, nGrams);
        words.frequency = termhood(words.frequency);
        let cv;
        for (i = 0; i < words.frequency.length; i++)
        {
            if (words.frequency[i].nested === false)
            {
                words.frequency[i].cvalue = Math.log2(words.frequency[i].size) * words.frequency[i].frequency;
            }
            else
            {
                words.frequency[i].cvalue = Math.log2(words.frequency[i].size) * (words.frequency[i].frequency - (1 / words.frequency[i].nestedTerms.length) * words.frequency[i].nestedFreq);
            }
        }
        words.frequency.sort(function (a, b)
        {
            return b.cvalue - a.cvalue;
        });
        cv = words.frequency[Math.floor(words.frequency.length * 0.25)].cvalue;
        let cvalueThreshold = [];
        for (i = 0; i < words.frequency.length; i++)
        {
            if (words.frequency[i].cvalue >= cv)
            {
                cvalueThreshold.push(words.frequency[i]);
            }
        }

        return cvalueThreshold;
    };

    let getContextWords = function (cvalue)
    {
        let contextWords = [];
        for (let i = 0; i < cvalue.length; i++)
        {
            contextWords.push(tokenizer.tokenize(cvalue[i].word)[0]);
        }
        return [...new Set(contextWords.map(obj => JSON.stringify(obj)))]
            .map(str => JSON.parse(str));
    };
    let getWeight = function (cvalue, contextWords, length)
    {
        let weight = [];
        let freq = 0;
        for (let i = 0; i < cvalue.length; i++)
        {
            freq = 0;
            for (let j = 0; j < cvalue.length; j++)
            {
                if (cvalue[j].word.indexOf(contextWords[i]) > -1)
                {
                    freq++;
                }
            }
            weight[i] = (freq / length);
        }
        return weight;
    };
    let ncvalue = function (cvalue, length)
    {
        let ncvalueList = {frequency: []};
        let contextWords = getContextWords(cvalue);
        let weight = getWeight(cvalue, contextWords, length);
        let weightSum;
        let ncvalue;
        for (let i = 0; i < cvalue.length; i++)
        {
            weightSum = 0;
            for (let j = 0; j < contextWords.length; j++)
            {
                if (cvalue[i].word.indexOf(contextWords[j]) > -1)
                {
                    weightSum += (cvalue[i].frequency - weight[j]);
                }
            }
            ncvalue = (0.8 * cvalue[i].cvalue) + (0.2 * weightSum);
            ncvalueList.frequency.push({word: cvalue[i].word, ncvalue: ncvalue});
        }
        ncvalueList.frequency.sort(function (a, b)
        {
            // ASC  -> a.length - b.length
            // DESC -> b.length - a.length
            return b.ncvalue - a.ncvalue;
        });
        return ncvalueList.frequency;
    };

    let processedTest = req.body.preprocessingResults;
    let results = [];
    let documents = [];
    let documentLength = [];
    let nounPhrase = [];
    for (let i = 0; i < processedTest.length; i++)
    {
        let preProcessedItem = processedTest[i];
        results.push(preProcessedItem.result);
        nounPhrase.push(preProcessedItem.nounPhraseList);
        documents.push(preProcessedItem.text);
        documentLength.push(wordCount(preProcessedItem.text));
    }

    if (method === "Yake!")
    {
        async.mapSeries(documents, yake, function (err, results)
        {
            if (!isNull(err))
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
                let dbpediaTerms = {
                    keywords: []
                };

                for (let i = 0; i < results.length; i++)
                {
                    for (let j = 0; j < results[i].keywords.length; j++)
                    {
                        dbpediaTerms.keywords.push({
                            words: results[i].keywords[j].ngram,
                            score: results[i].keywords[j].score
                        });
                    }
                }

                dbpediaTerms.keywords = dbpediaTerms.keywords.reduceRight(function (r, a)
                {
                    r.some(function (b)
                    {
                        return a.words === b.words;
                    }) || r.push(a);
                    return r;
                }, []);
                dbpediaTerms.keywords.sort(function (a, b)
                {
                    return parseFloat(a.score) - parseFloat(b.score);
                });

                res.status(200).json(
                    {
                        dbpediaTerms: dbpediaTerms
                    }
                );
            }
        });
    }
    else
    {
        if (Config.keywords_extraction.corenlp.active)
        {
            let nounPhraseFinal = [];
            let dbpediaTerms = {
                keywords: []
            };

            for (let i = 0; i < nounPhrase.length; i++)
            {
                for (let j = 0; j < nounPhrase[i].length; j++)
                {
                    nounPhraseFinal.push(nounPhrase[i][j]);
                }
            }

            nounPhraseFinal.sort(function (a, b)
            {
                return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
            });
            /*
             let nGrams = [];
             for (let i = 0; i < nounPhraseSimple.length; i++)
                {
                    if (tokenizer.tokenize(nounPhraseSimple[i]).length <= 5 && tokenizer.tokenize(nounPhraseSimple[i]).length >= 2)
                    {
                        nGrams.push(nounPhraseSimple[i]);
                    }
                    else
                    {
                        // console.log(nounphrasesimple[i]);
                    }
                }
                nGrams.sort(function (a, b)
                {
                // ASC  -> a.length - b.length
                // DESC -> b.length - a.length
                    return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
                });
    */
            if (!isNull(nounPhraseFinal) && nounPhraseFinal instanceof Array && nounPhraseFinal.length > 0)
            {
                let tokenized = tokenizer.tokenize(nounPhraseFinal[0]);
                let cvaluengrams = cvalue(nounPhraseFinal, documents, tokenized.length);
                ncvalue(cvaluengrams, cvaluengrams.length);

                let nnnn = removeExtraTerms(cvaluengrams);

                nnnn.sort(function (a, b)
                {
                    return b.cvalue - a.cvalue;
                });

                for (let index = 0; index < nnnn.length; index++)
                {
                    if (tokenizer.tokenize(nnnn[index].word).length <= 3)
                    {
                        dbpediaTerms.keywords.push({
                            words: nnnn[index].word,
                            score: nnnn[index].cvalue
                        });
                    }
                }

                dbpediaTerms.keywords.sort(function (a, b)
                {
                    return parseFloat(b.score) - parseFloat(a.score);
                });

                res.status(200).json(
                    {
                        dbpediaTerms: dbpediaTerms
                    }
                );
            }
            else
            {
                res.status(200).json(
                    {
                        dbpediaTerms: []
                    }
                );
            }
        }
        else
        {
            res.status(400).json(
                {
                    result: "error",
                    message: "Invalid Extraction Method : " + method
                }
            );
        }
    }
};

module.exports.dbpediaResourceLookup = function (req, res)
{
    req.setTimeout(2500000);

    let searchDb = function (lookup, cb)
    {
        // baseRequest("http://lookup.dbpedia.org/api/search/PrefixSearch?QueryClass=&MaxHits=25&QueryString=" + lookup.words, function getResponse (error, response, body)
        baseRequest("http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=&MaxHits=25&QueryString=" + lookup.words, function getResponse (error, response, body)
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
    let dbpediaQueries = req.body.keywords;

    let dbpediaResources = {result: []};
    let position;
    async.mapSeries(dbpediaQueries, searchDb, function (err, results2)
    {
        if (err)
        {
            res.status(500).json(
                {
                    dbpediaResources: dbpediaResources
                }
            );
        }
        else
        {
            for (let i = 0; i < results2.length; i++)
            {
                if (!isNull(results2[i]) && !isNull(results2[i].results) && results2[i].results.length > 0)
                {
                    position = 0;
                    let similar = 0;
                    for (let x = 0; x < results2[i].results.length; x++)
                    {
                        let current = stringSimilarity.compareTwoStrings(dbpediaQueries[i].words, results2[i].results[x].label);
                        if (current > similar)
                        {
                            similar = Number(current);
                            position = x;
                        }
                    }
                    dbpediaResources.result.push({
                        searchTerm: dbpediaQueries[i].words,
                        score: dbpediaQueries[i].score,
                        dbpediaLabel: results2[i].results[position].label,
                        dbpediaUri: results2[i].results[position].uri,
                        dbpediaDescription: results2[i].results[position].description
                    });
                }
                // else
                // {
                //     dbpediaResources.result.push({
                //         searchTerm: dbpediaQueries[i].words,
                //         score: dbpediaQueries[i].score,
                //         error: "undefined term in dbpedia"
                //     });
                // }
            }
            res.status(200).json(
                {
                    dbpediaResources: dbpediaResources
                }
            );
        }
    });
};

module.exports.lovProperties = function (req, res)
{
    req.setTimeout(2500000);
    let searchLov = function (dbpedia, cb)
    {
        baseRequest("http://lov.okfn.org/dataset/lov/api/v2/term/search?q=" + dbpedia.searchTerm + "&type=property", function getResponse (error, response, body)
        {
            if (!error && response.statusCode === 200)
            {
                cb(null, JSON.parse(body));
            }
            else
            {
                cb(error);
            }
        });
    };

    let dbpediaResults = req.body.concepts;
    async.mapSeries(dbpediaResults, searchLov, function (err, results)
    {
        let lovProperties = [];
        if (err)
        {
            // console.log(err);
            res.status(500).json(lovProperties);
        }
        else
        {
            for (let i = 0; i < results.length; i++)
            {
                let result = results[i];
                if (!isNull(result))
                {
                    _.map(result.results, function(result)
                    {
                        let lovLabel;
                        let lovHighlight;
                        if (!isNull(Object.values(result.highlight)[0]))
                        {
                            lovLabel = stripTags(Object.values(result.highlight)[0]);
                        }
                        else
                        {
                            lovLabel = "";
                        }
                        if (!isNull(Object.values(result.highlight)[1]))
                        {
                            lovHighlight = stripTags(Object.values(result.highlight)[1]);
                        }
                        else
                        {
                            lovHighlight = "";
                        }
                        if (!lovProperties.some(item => item.lovLabel === lovLabel))
                        {
                            lovProperties.push({
                                searchTerm: dbpediaResults[i].searchTerm,
                                score: dbpediaResults[i].score,
                                lovScore: result.score,
                                lovVocabulary: result["vocabulary.prefix"][0],
                                lovUri: result.uri[0],
                                lovLabel: lovLabel,
                                lov_highlight: lovHighlight,
                                lov_label_and_highlight: Object.values(result.highlight)[0]
                            });
                        }
                        else
                        {
                            lovProperties.push({
                                searchTerm: dbpediaResults[i].searchTerm,
                                score: dbpediaResults[i].score,
                                lovScore: result.score,
                                lovVocabulary: result["vocabulary.prefix"][0],
                                lovUri: result.uri[0],
                                lovLabel: "",
                                lov_highlight: lovHighlight,
                                lov_label_and_highlight: Object.values(result.highlight)[0]
                            });
                        }
                    });
                }
            }
            res.status(200).json(
                {
                    lovProperties: lovProperties
                }
            );
        }
    });
};

module.exports.clustering = function (req, res)
{
    function splitTerm (term)
    {
        let termTokens = [];
        let currentTerm;
        for (let i = 0; i < tokenizer.tokenize(term).length; i++)
        {
            termTokens.push(tokenizer.tokenize(term)[i]);
            currentTerm = tokenizer.tokenize(term)[i];
            for (let j = (i + 1); j < tokenizer.tokenize(term).length; j++)
            {
                currentTerm += (" " + tokenizer.tokenize(term)[j]);
                termTokens.push(currentTerm);
            }
        }
        termTokens.sort(function (a, b)
        {
            return tokenizer.tokenize(b).length - tokenizer.tokenize(a).length;
        });
        return termTokens;
    }

    function lexicalSimilarity (listA, listB)
    {
        let similarity = 0;
        let equal = 0;
        if (tokenizer.tokenize(listA[0])[tokenizer.tokenize(listA[0]).length - 1] === tokenizer.tokenize(listB[0])[tokenizer.tokenize(listB[0]).length - 1])
        {
            similarity = (1 / 2);
        }
        else
        {
            similarity = 0;
        }
        for (let i = 0; i < listA.length; i++)
        {
            for (let j = 0; j < listB.length; j++)
            {
                if (listA[i] === listB[j])
                {
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
    for (let i = 0; i < dbpediaResults.length; i++)
    {
        testArray.push(splitTerm(dbpediaResults[i].words));
    }
    for (let i = 0; i < testArray.length; i++)
    {
        headwords.push(tokenizer.tokenize(testArray[i][0])[tokenizer.tokenize(testArray[i][0]).length - 1]);
    }

    let headSimple = [...new Set(headwords.map(obj => JSON.stringify(obj)))]
        .map(str => JSON.parse(str));

    function distance (a, b)
    {
        return lexicalSimilarity(splitTerm(a.words), splitTerm(b.words));
    }

    let levels = cluster({
        input: dbpediaResults,
        distance: distance,
        linkage: "average",
        minClusters: headSimple.length // only want two clusters
    });

    let clusters = levels[levels.length - 1].clusters;

    clusters = clusters.map(function (cluster)
    {
        return cluster.map(function (index)
        {
            return dbpediaResults[index];
        });
    });
    clusters.sort(function (a, b)
    {
        return b.length - a.length;
    });

    res.status(200).json(
        {
            clusters
        }
    );
};

module.exports.text2owl = function (rec, res)
{

};

