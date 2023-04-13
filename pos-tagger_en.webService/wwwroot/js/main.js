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
        let len = $('#text').val().length, len_txt = len.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        $('#textLength').toggleClass('max-inputtext-length', MAX_INPUTTEXT_LENGTH < len).html('length of text: ' + len_txt + ' characters');
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

    $('#text').focus(textOnChange).change(textOnChange).keydown(textOnChange).keyup(textOnChange).select(textOnChange).focus();

    (function () {
        function isGooglebot() { return (navigator.userAgent.toLowerCase().indexOf('googlebot/') !== -1); };
        if (isGooglebot()) return;

        var text = localStorage.getItem(LOCALSTORAGE_TEXT_KEY);
        if (!text || !text.length) text = DEFAULT_TEXT;
        $('#text').val(text).focus();
    })();    
    $('#detailedView').click(function () {
        var $this = $(this), isDetailedView = $this.is(':checked');
        if (isDetailedView) {
            $this.parent().css({ 'color': 'cadetblue', 'font-weight': 'bold' });
        } else {
            $this.parent().css({ 'color': 'gray', 'font-weight': 'normal' });
        }

        if (_LastQuery) {
            var html;
            if (isDetailedView) {
                html = detailedView(_LastQuery.resp, _LastQuery.text);
            } else {
                html = shortView(_LastQuery.resp, _LastQuery.text);
            }
            $('#processResult tbody').html(html);
        }
    });
    $('#resetText2Default').click(function () {
        $('#text').val('');
        setTimeout(() => $('#text').val(DEFAULT_TEXT).focus(), 100);
    });

    $('#processButton').click(function () {
        if($(this).hasClass('disabled')) return (false);

        var text = getText( $('#text') );
        if (!text) return (false);

        var isDetailedView = $('#detailedView').is(':checked');
        _LastQuery = undefined;

        processing_start();
        if (text !== DEFAULT_TEXT) {
            localStorage.setItem(LOCALSTORAGE_TEXT_KEY, text);
        } else {
            localStorage.removeItem(LOCALSTORAGE_TEXT_KEY);
        }        

        var model = {
            splitBySmiles: true,
            text         : text
        };
        $.ajax({
            type       : 'POST',
            contentType: 'application/json',
            dataType   : 'json',
            url        : '/Process/Run',
            data       : JSON.stringify( model ),
            success: function (resp) {
                if (resp.err) {
                    if (resp.err === 'goto-on-captcha') {
                        window.location.href = '/Captcha/GetNew';
                    } else {
                        processing_end();
                        $('.result-info').addClass('error').text(resp.err);
                    }
                } else {
                    if (resp.sents && resp.sents.length) {
                        $('.result-info').removeClass('error').text('');
                        var html;
                        if (isDetailedView) {
                            html = detailedView(resp, text);
                        } else {
                            html = shortView(resp, text);
                        }
                        $('#processResult tbody').html(html);
                        $('.result-info').hide();
                        processing_end();
                        _LastQuery = { resp: resp, text: text };
                    } else if (resp.html) {
                        $('.result-info').removeClass('error').text('');
                        $('#processResult tbody').html(resp.html);
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

    function shortView(resp, text) {
        var trs = [];
        for (var i = 0, len = resp.sents.length; i < len; i++) {
            var words_by_sent = resp.sents[i];
            var tr = "<tr><td><span class='sent-number'>" + (i + 1) + "]. </span></td><td>";
            for (var j = 0, len_2 = words_by_sent.length; j < len_2; j++) {
                var word = words_by_sent[ j ],
                    wordValueOrigin = text.substr( word.i, word.l ); //word.v;
                if (!word.p) {
                    tr += " ";
                }
                var morpho = word.morpho;
                if (morpho) {
                    tr += "<span title='" + morpho.pos;
                    if (word.pos !== morpho.pos) {
                        tr += " (" + word.pos + ")";
                    }
                    tr += "'>" + (morpho.nf || wordValueOrigin) + "</span>";
                } else {
                    tr += wordValueOrigin;
                }
            }
            tr += "</td></tr>";
            trs[ i ] = tr;
        }
        return (trs.join(''));
    };
    function detailedView(resp, text) {
        var header = "<tr>" +
                     "<td class='caption'>original-word</td>" +
                     "<td class='caption'>normal-form</td>" +
                     "<td class='caption'>part-of-speech</td>" +
                     "<td class='caption'>morpho-features</td>" +
                     "</tr>";
        var trs = [header];

        for (var i = 0, len = resp.sents.length - 1; i <= len; i++) {
            var words_by_sent = resp.sents[ i ],
                wordFirst = words_by_sent[ 0 ],
                wordLast  = words_by_sent[ words_by_sent.length - 1 ],
                sentText  = text.substr(wordFirst.i, wordLast.i + wordLast.l - wordFirst.i),
                sentNumber = (i + 1),
                even_odd = (((sentNumber % 2) === 0) ? "even" : "odd");
            var tr = "<tr class='" + even_odd + "'>" +
                       "<td colspan='4'><span class='sent-number'>" + sentNumber + "). <i>" + sentText + "</i></span></td>" +
                     "</tr>";
            for (var j = 0, len_2 = words_by_sent.length; j < len_2; j++) {
                var word = words_by_sent[ j ],
                    wordValueOrigin = text.substr( word.i, word.l ); //word.v;
                tr += "<tr class='" + even_odd + "'> <td class='word'>" + wordValueOrigin + "</td> ";
                var morpho = word.morpho;
                if (morpho) {
                    tr += "<td><b>" + (morpho.nf || wordValueOrigin) + "</b></td>";
                    tr += "<td> <span class='" + morpho.pos + "-2'>" + morpho.pos + "</span>";
                    if (word.pos !== morpho.pos) {
                        tr += " |<span class='" + word.pos + "-2'>" + word.pos + "</span>";
                    }
                    tr += "</td>";
                    tr += "<td> <span class='MA'>" + morpho.ma + "</span> </td>";
                } else {
                    tr += "<td><b>" + wordValueOrigin + "</b></td>";
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
        $('.result-info').show().removeClass('error').html('Processing... <label id="processingTickLabel"></label>');
        $('#processButton').addClass('disabled');
        $('#processResult tbody').empty();
        processingTickCount = 1; setTimeout(processing_tick, 1000);
    };
    function processing_end(){
        $('#text').removeClass('no-change').removeAttr('readonly').removeAttr('disabled');
        $('.result-info').removeClass('error').text('');
        $('#processButton').removeClass('disabled');
    };
    function trim_text(text) { return (text.replace(/(^\s+)|(\s+$)/g, '')); };
    function is_text_empty(text) { return (!trim_text(text)); };

    var processingTickCount = 1,
        processing_tick = function() {
            var n2 = function (n) {
                n = n.toString();
                return ((n.length === 1) ? ('0' + n) : n);
            }
            var d = new Date(new Date(new Date(new Date().setHours(0)).setMinutes(0)).setSeconds(processingTickCount));
            var t = n2(d.getHours()) + ':' + n2(d.getMinutes()) + ':' + n2(d.getSeconds()); //d.toLocaleTimeString();
            var $s = $('#processingTickLabel');
            if ($s.length) {
                $s.text(t);
                processingTickCount++;
                setTimeout(processing_tick, 1000);
            } else {
                processingTickCount = 1;
            }
        };
});
