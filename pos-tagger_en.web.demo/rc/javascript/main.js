$(document).ready(function () {
    var MAX_INPUTTEXT_LENGTH  = 10000,
        LOCALSTORAGE_TEXT_KEY = 'pos-tagger-en-text',
        DEFAULT_TEXT          = 'Donald John Trump is an American businessman, television personality, politician, and the 45th President of the United States. ' +
'Born and raised in Jamaica, Queens, New York City, Trump received an economics degree from the Wharton School of the University of Pennsylvania in 1968. In 1971, he took charge of his family\'s real estate and construction firm, Elizabeth Trump & Son, which was later renamed The Trump Organization. ' +
'During his business career, Trump built, renovated, and managed numerous office towers, hotels, casinos, and golf courses. He has lent the use of his name in the branding of various products. ' +
'He owned the Miss USA and Miss Universe pageants from 1996 to 2015, and from 2004 to 2015, he hosted The Apprentice, a reality television series on NBC. ' +
'As of 2016, Forbes listed him as the 324th wealthiest person in the world and 113th richest in the United States, with a net worth of $4.5 billion.\n' +
'\n' +
'The iggle squiggs trazed wombly in the harlish hoop.\n' + 
'Twas brillig, and the slithy toves did gyre and gimble in the wabe: all mimsy were the borogoves, and the mome raths outgrabe.';

    var textOnChange = function () {
        var _len = $("#text").val().length; 
        var len = _len.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        var $textLength = $("#textLength");
        $textLength.html("length of text: " + len + " characters");
        if (MAX_INPUTTEXT_LENGTH < _len) $textLength.addClass("max-inputtext-length");
        else                             $textLength.removeClass("max-inputtext-length");
    };
    var getText = function( $text ) {
        var text = trim_text( $text.val().toString() );
        if (is_text_empty(text)) {
            alert("Enter the text to be processed.");
            $text.focus();
            return (null);
        }
        
        if (text.length > MAX_INPUTTEXT_LENGTH) {
            if (!confirm('Exceeded the recommended limit ' + MAX_INPUTTEXT_LENGTH + ' characters (on the ' + (text.length - MAX_INPUTTEXT_LENGTH) + ' characters).\r\nText will be truncated, continue?')) {
                return (null);
            }
            text = text.substr( 0, MAX_INPUTTEXT_LENGTH );
            $text.val( text );
            $text.change();
        }
        return (text);
    };

    $("#text").focus(textOnChange).change(textOnChange).keydown(textOnChange).keyup(textOnChange).select(textOnChange).focus();

    (function () {
        function isGooglebot() {
            return (navigator.userAgent.toLowerCase().indexOf('googlebot/') != -1);
        };
        if (isGooglebot())
            return;

        var text = localStorage.getItem(LOCALSTORAGE_TEXT_KEY);
        if (!text || !text.length) {
            text = DEFAULT_TEXT;
        }
        $('#text').text(text).focus();
    })();

    $('#detailedView').click(function () {
        var $detailedView = $('#detailedView');
        if ($detailedView.is(':checked')) {
            $detailedView.parent().css({'color':'cadetblue', 'font-weight':'bold'});
        } else {
            $detailedView.parent().css({'color': 'gray', 'font-weight': 'normal'});
        }
    });

    $('#mainPageContent').on('click', '#processButton', function () {
        if($(this).hasClass('disabled')) return (false);

        var text = getText( $("#text") );
        if (!text) return (false);

        var isDetailedView = $('#detailedView').is(':checked');
        
        processing_start();
        if (text != DEFAULT_TEXT) {
            localStorage.setItem(LOCALSTORAGE_TEXT_KEY, text);
        } else {
            localStorage.removeItem(LOCALSTORAGE_TEXT_KEY);
        }

        $.ajax({
            type: "POST",
            url:  "RESTProcessHandler.ashx",
            data: {
                splitBySmiles: true,                
                text         : text,
                html         : false
            },
            success: function (responce) {
                if (responce.err) {
                    if (responce.err == "goto-on-captcha") {
                        window.location.href = "Captcha.aspx";
                    } else {
                        processing_end();
                        $('.result-info').addClass('error').text(responce.err);
                    }
                } else {
                    if (responce.sents && responce.sents.length != 0) {
                        $('.result-info').removeClass('error').text('');
                        var html;
                        if (isDetailedView) {
                            html = detailedView( responce, text );
                        } else {
                            html = shortView( responce, text );
                        }
                        $('#processResult tbody').html(html);
                        $('.result-info').hide();
                        processing_end();
                    } else if (responce.html) {
                        $('.result-info').removeClass('error').text('');
                        $('#processResult tbody').html(responce.html);
                        processing_end();
                    } else {
                        processing_end();
                        $('.result-info').text('significant entity not found in the text');
                    }
                }
            },
            error: function () {
                processing_end();
                $('.result-info').addClass('error').text('server error');
            }
        });
        
    });

    force_load_model();

    function shortView(responce, text) {
        var trs = [];
        for (var i = 0, len = responce.sents.length; i < len; i++) {
            var words_by_sent = responce.sents[i];
            var tr = "<tr><td><span class='sent-number'>" + (i + 1) + "]. </span></td><td>";
            for (var j = 0, len_2 = words_by_sent.length; j < len_2; j++) {
                var word = words_by_sent[j];
                if (!word.p) {
                    tr += " ";
                }
                var morpho = word.morpho;
                if (morpho) {
                    tr += "<span title='" + morpho.pos;
                    if (word.pos !== morpho.pos) {
                        tr += " (" + word.pos + ")";
                    }
                    tr += "'>" + (morpho.nf || word.v) + "</span>";
                } else {
                    tr += word.v;
                }
            }
            tr += "</td></tr>";
            trs[ i ] = tr;
        }
        return (trs.join(''));
    };
    function detailedView(responce, text) {
        var header = "<tr>" +
                     "<td class='caption'>original-word</td>" +
                     "<td class='caption'>normal-form</td>" +
                     "<td class='caption'>part-of-speech</td>" +
                     "<td class='caption'>morpho-features</td>" +
                     "</tr>";
        var trs = [];
        trs[0] = header;

        for (var i = 0, len = responce.sents.length - 1; i <= len; i++) {
            var words_by_sent = responce.sents[i],
                wordFirst = words_by_sent[ 0 ],
                wordLast  = words_by_sent[ words_by_sent.length - 1 ],
                sentText  = text.substr(wordFirst.i, wordLast.i + wordLast.l - wordFirst.i),
                sentNumber = (i + 1),
                even_odd = (((sentNumber % 2) == 0) ? "even" : "odd");
            var tr = "<tr class='" + even_odd + "'>" +
                       "<td colspan='4'><span class='sent-number'>" + sentNumber + "). <i>" + sentText + "</i></span></td>" +
                     "</tr>";
            for (var j = 0, len_2 = words_by_sent.length; j < len_2; j++) {
                var word = words_by_sent[ j ];
                tr += "<tr class='" + even_odd + "'> <td class='word'>" + word.v + "</td> ";
                var morpho = word.morpho;
                if (morpho) {
                    tr += "<td><b>" + (morpho.nf || word.v) + "</b></td>";
                    tr += "<td> <span class='" + morpho.pos + "-2'>" + morpho.pos + "</span>";
                    if (word.pos !== morpho.pos) {
                        tr += " |<span class='" + word.pos + "-2'>" + word.pos + "</span>";
                    }
                    tr += "</td>";
                    tr += "<td> <span class='MA'>" + morpho.ma + "</span> </td>";
                } else {
                    tr += "<td><b>" + word.v + "</b></td>";
                    if (word.p) {
                        tr += "<td><span class='O'> <span class='font-small'>(punctuation)</span> </span></td> <td><span class='MA'>-</span></td>";
                    } else {
                        tr += "<td><span class='" + word.pos + "-2'>" + word.pos + "</span></td> <td><span class='MA'>-</span></td>";
                    }
                }
                tr += "</tr>";
            }
            tr += "<tr><td colspan='4' /></tr>";
            //if (i != len) tr += header;
            trs[ sentNumber ] = tr;
        }
        return (trs.join(''));
    };

    function processing_start(){
        $('#text').addClass('no-change').attr('readonly', 'readonly').attr('disabled', 'disabled');
        $('.result-info').show().removeClass('error').text('Processing...');
        $('#processButton').addClass('disabled');
        $('#processResult tbody').empty();
    };
    function processing_end(){
        $('#text').removeClass('no-change').removeAttr('readonly').removeAttr('disabled');
        $('.result-info').removeClass('error').text('');
        $('#processButton').removeClass('disabled');
    };
    function trim_text(text) {
        return (text.replace(/(^\s+)|(\s+$)/g, ""));
    };
    function is_text_empty(text) {
        return (text.replace(/(^\s+)|(\s+$)/g, "") == "");
    };
    function force_load_model() {
        $.ajax({
            type: "POST",
            url: "RESTProcessHandler.ashx",
            data: { splitBySmiles: true, text: "_dummy_", html: false }
        });
    };
});