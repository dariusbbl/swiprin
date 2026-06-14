package com.swiprin.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TextSimilarityService {

    private static final Set<String> STOPWORDS = Set.of(
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "shall",
        "should", "may", "might", "must", "can", "could", "and", "or", "but",
        "if", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as",
        "into", "through", "during", "including", "until", "against", "among",
        "throughout", "despite", "towards", "upon", "about", "this", "that",
        "these", "those", "it", "its", "we", "our", "you", "your", "they",
        "their", "i", "me", "my", "him", "her", "us", "them", "what", "which",
        "who", "not", "no", "so", "than", "then", "when", "where", "how",
        "requirements", "requirement", "require",
        "responsibilities", "responsibility",
        "preferred", "preferr",
        "qualifications", "qualification", "qualific",
        "benefits", "benefit"
    );

    // Normalizes tech abbreviations to their canonical forms after lowercase
    // so "JS developer" and "JavaScript developer" produce the same token
    private static final Map<String, String> NORMALIZATION = Map.ofEntries(
        Map.entry("js",   "javascript"),
        Map.entry("ts",   "typescript"),
        Map.entry("py",   "python"),
        Map.entry("rb",   "ruby"),
        Map.entry("css",  "css"),
        Map.entry("html", "html"),
        Map.entry("sql",  "sql"),
        Map.entry("aws",  "aws"),
        Map.entry("gcp",  "gcp"),
        Map.entry("api",  "api"),
        Map.entry("rest", "rest"),
        Map.entry("ui",   "ui"),
        Map.entry("ux",   "ux"),
        Map.entry("ml",   "machinelearning"),
        Map.entry("ai",   "artificialintelligence"),
        Map.entry("ci",   "continuousintegration"),
        Map.entry("cd",   "continuousdeployment")
    );

    // Phrase normalization applied before tokenization — longer phrases must come first
    // so "natural language processing" is caught before "natural language".
    private static final List<String[]> PHRASE_REPLACEMENTS = List.of(
        // Section headings and boilerplate phrases wiped out before tokenization
        new String[]{"nice to have",                " "},
        new String[]{"nice-to-have",                " "},
        new String[]{"what you'll do",              " "},
        new String[]{"what you will do",            " "},
        new String[]{"about us",                    " "},
        new String[]{"who we are",                  " "},
        new String[]{"our company",                 " "},
        new String[]{"natural language processing", "nlp"},
        new String[]{"natural language",            "nlp"},
        new String[]{"machine learning",            "machinelearning"},
        new String[]{"deep learning",               "deeplearning"},
        new String[]{"object-oriented",             "oop"},
        new String[]{"object oriented",             "oop"},
        new String[]{"continuous integration",      "continuousintegration"},
        new String[]{"continuous deployment",       "continuousdeployment"},
        new String[]{"version control",             "versioncontrol"},
        new String[]{"spring-boot",                 "springboot"},
        new String[]{"spring boot",                 "springboot"},
        new String[]{"node.js",                     "nodejs"},
        new String[]{"react.js",                    "reactjs"},
        new String[]{"next.js",                     "nextjs"},
        new String[]{"vue.js",                      "vuejs"},
        new String[]{"nuxt.js",                     "nuxtjs"},
        new String[]{"express.js",                  "expressjs"},
        new String[]{"angular.js",                  "angularjs"}
    );

    // Text is already lowercased by preprocess(), so we match lowercase only.
    // Special tokens (c++, c#, .net, f#) are listed explicitly.
    // [a-z]{2,} catches abbreviations like js, ui, ai, ml after lowercasing.
    private static final Pattern TOKEN = Pattern.compile(
        "c\\+\\+|c#|\\.net|f#|[a-z]{2,}"
    );

    private static final Pattern HTML_TAG = Pattern.compile("<[^>]+>");

    // -----------------------------------------------------------------------

    // TF-weighted recall: what fraction of the JD's vocabulary (weighted by
    // how often each term appears in the JD) is covered by the CV.
    // Extra content in the CV does not penalize — we only iterate over JD terms.
    public double coverageScore(String cvText, String jobDescription) {
        if (cvText == null || jobDescription == null || cvText.isBlank() || jobDescription.isBlank()) return 0.0;

        Map<String, Integer> jdTf  = termFrequency(preprocess(stripHtml(jobDescription)));
        Set<String>          cvSet = termFrequency(preprocess(stripHtml(cvText))).keySet();

        if (jdTf.isEmpty()) return 0.0;

        double totalWeight   = 0.0;
        double coveredWeight = 0.0;
        for (Map.Entry<String, Integer> e : jdTf.entrySet()) {
            double w = e.getValue();
            totalWeight += w;
            if (cvSet.contains(e.getKey())) coveredWeight += w;
        }

        return totalWeight == 0.0 ? 0.0 : coveredWeight / totalWeight;
    }

    // -----------------------------------------------------------------------

    // Lowercase + phrase replacements before tokenization
    private String preprocess(String text) {
        String result = text.toLowerCase();
        for (String[] r : PHRASE_REPLACEMENTS) {
            result = result.replace(r[0], r[1]);
        }
        return result;
    }

    private Map<String, Integer> termFrequency(String text) {
        Map<String, Integer> freq = new HashMap<>();
        Matcher m = TOKEN.matcher(text);
        while (m.find()) {
            String token = normalize(m.group());
            if (!STOPWORDS.contains(token)) {
                freq.merge(token, 1, Integer::sum);
            }
        }
        return freq;
    }

    private String normalize(String token) {
        // Map abbreviations to canonical forms (js → javascript, ui → ui, etc.)
        String mapped = NORMALIZATION.get(token);
        if (mapped != null) return mapped;

        // Simple suffix stemming so developer/developing/development share a root
        return stem(token);
    }

    private String stem(String word) {
        if (word.length() > 7 && word.endsWith("ation"))  return word.substring(0, word.length() - 5);
        if (word.length() > 6 && word.endsWith("ment"))   return word.substring(0, word.length() - 4);
        if (word.length() > 6 && word.endsWith("ness"))   return word.substring(0, word.length() - 4);
        if (word.length() > 6 && word.endsWith("ing"))    return word.substring(0, word.length() - 3);
        if (word.length() > 5 && word.endsWith("ive"))    return word.substring(0, word.length() - 3);
        if (word.length() > 5 && word.endsWith("er"))     return word.substring(0, word.length() - 2);
        if (word.length() > 5 && word.endsWith("ed"))     return word.substring(0, word.length() - 2);
        if (word.length() > 5 && word.endsWith("al"))     return word.substring(0, word.length() - 2);
        if (word.length() > 5 && word.endsWith("ly"))     return word.substring(0, word.length() - 2);
        return word;
    }

    private String stripHtml(String html) {
        return HTML_TAG.matcher(html).replaceAll(" ");
    }
}
