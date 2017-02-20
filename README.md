# lingvo--PosTagger-ru

<a target="_blank" href="http://pos-en.apphb.com/index.html">[ live demo ]</a>

<div style="padding: 20px">
    <div>
        <p>
        Normalization of text is called to bring all the words of the text to the dictionary form: in the nominative case, a single number (if any) or the infinitive for verbs.
        <br/>
	    Normalization is necessary, for example, to quickly find words in dictionaries, syntactic and semantic analysis of the text.
        This procedure is especially important for language grammatical groups, such as russian or finnish, whose rich morphology (strong inflection in the investigation of the grammatical variation).
	    </p><p>
	    Normalization is a disambiguation with and without it.
	    (Homonymy - Match words, the semantic values which does not involve).
	    Disambiguation means that a particular algorithm selected one word from the set of proposed morfoslovarem.
	    <br/>
	    Disambiguation - it time-consuming and costly in time and resources.
        Therefore, it is not often used in text processing systems, and cost "Stemming" - bringing the words to a normal form by the end of it.
        In this case, selecting from a plurality of normal form is random.
	    <br/>
	    Methods disambiguation different. The basis of most of them is the morphological and chastirechny analysis of each word, followed by the imposition of the rules of coordination and management.
	    </p><p>
	    A special feature of this module is that it involves the entire sequence of linguistic processing of text:
	    <ul style="margin-left: 25px">
		    <li> - the text is divided into proposals;
		    <li> - defined parts of speech of words of text (called PoS-tagging - Part-of-Speech tagging);
		    <li> - morphological characteristics are all words;
		    <li> - removed homonymy;
	    </ul>
	    The final quality is determined by all processing steps and is defined as the morphological dictionaries, and statistical models.
        This makes it possible to achieve good results on the normalization of the relationship speed / quality.
	    </p>
	    <p>
	    The processing speed of this module is about 350 KB/sec.
	    </p>
    </div>
</div>
