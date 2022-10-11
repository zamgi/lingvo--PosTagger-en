using System;
using System.Collections.Generic;
using System.ComponentModel.Design;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

using lingvo.tokenizing;

namespace lingvo.postagger
{
    /// <summary>
    /// 
    /// </summary>
    internal static class Program
    {
        private static async Task Main( string[] args )
        {
            try
            {
                var text = @"Donald John Trump is an American businessman, television personality, politician, and the 45th President of the United States. " +
"Born and raised in Jamaica, Queens, New York City, Trump received an economics degree from the Wharton School of the University of Pennsylvania in 1968. In 1971, he took charge of his family\"s real estate and construction firm, Elizabeth Trump & Son, which was later renamed The Trump Organization. " +
"During his business career, Trump built, renovated, and managed numerous office towers, hotels, casinos, and golf courses. He has lent the use of his name in the branding of various products. " +
"He owned the Miss USA and Miss Universe pageants from 1996 to 2015, and from 2004 to 2015, he hosted The Apprentice, a reality television series on NBC. " +
"As of 2016, Forbes listed him as the 324th wealthiest person in the world and 113th richest in the United States, with a net worth of $4.5 billion.\n" +
"\n" +
"The iggle squiggs trazed wombly in the harlish hoop.\n" +
"Twas brillig, and the slithy toves did gyre and gimble in the wabe: all mimsy were the borogoves, and the mome raths outgrabe.";

                var opts = new PosTaggerEnvironmentConfigImpl();
                await ProcessText( opts, text ).CAX();

                //---ProcessText_without_Morphology( opts, text );
            }
            catch ( Exception ex )
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine( Environment.NewLine + ex + Environment.NewLine );
                Console.ResetColor();
            }

            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine( "  [.......finita fusking comedy.......]" );
            Console.ReadLine();
        }

        private static async Task ProcessText( PosTaggerEnvironmentConfigBase opts, string text )
        {
            using ( var env = await PosTaggerEnvironment.CreateAsync( opts ).CAX() )
            using ( var posTaggerProcessor = env.CreatePosTaggerProcessor() )
            {
                Console.WriteLine( "\r\n-------------------------------------------------\r\n text: '" + text + '\'' );

                var result = posTaggerProcessor.Run( text, true );

                Console.WriteLine( "-------------------------------------------------\r\n pos-tagger-entity-count: " + result.Count + Environment.NewLine );
                foreach ( var word in result )
                {
                    Console.WriteLine( word/*.ToString().Replace( "__UNDEFINED__", " " )*/ );
                }
                Console.WriteLine();

                var result_details = posTaggerProcessor.Run_Details( text, true, true, true, true );

                Console.WriteLine( "-------------------------------------------------\r\n pos-tagger-entity-count: " + result_details.Count + Environment.NewLine );
                foreach ( var r in result_details )
                {
                    foreach ( var word in r )
                    {
                        Console.WriteLine( word/*.ToString().Replace( "__UNDEFINED__", " " )*/ );
                    }
                    Console.WriteLine();
                }
                Console.WriteLine( "-------------------------------------------------\r\n" );
            }
        }

        //=============== Only PoS-Tagger (without Morphology) ===============//
        private static void ProcessText_without_Morphology( PosTaggerEnvironmentConfigBase opts, string text )
        {
            var (config, ssc) = opts.CreatePosTaggerProcessorConfig();

            using ( ssc )
            using ( var tokenizer = new Tokenizer( config.TokenizerConfig ) )
            using ( var posTaggerScriber = PosTaggerScriber.Create( config.ModelFilename, config.TemplateFilename ) )
            {
                var posTaggerPreMerging = new PosTaggerPreMerging( config.Model );
                var result              = new List< word_t >();

                tokenizer.Run( text, true, words =>
                {
                    //-merge-phrases-abbreviations-numbers-
                    posTaggerPreMerging.Run( words );

                    //directly pos-tagging
                    posTaggerScriber.Run( words );

                    result.AddRange( words );
                });

                Console.WriteLine( "pos-tagger-entity-count: " + result.Count + Environment.NewLine );
                foreach ( var w in result )
                {
                    Console.WriteLine( w );
                }
                Console.WriteLine();
            }
        }

        private static ConfiguredTaskAwaitable< T > CAX< T >( this Task< T > t ) => t.ConfigureAwait( false );
        private static ConfiguredTaskAwaitable CAX( this Task t ) => t.ConfigureAwait( false );
    }
}
