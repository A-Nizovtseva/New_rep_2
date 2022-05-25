# -*- coding: utf-8 -*-
from xhtml2pdf import pisa
sourceHtml = '<html>' \
             '    <head>' \
             '        <meta content="text/html; charset=utf-8" http-equiv="Content-Type">' \
             '        <style type="text/css">' \
             '            @page { size: A4; margin: 1cm; }' \
             '            @font-face { font-family: Arial; src: url(/pathToTTF/arial.ttf); }' \
             '            p { color: red; font-family: Arial; }' \
             '        </style>' \
             '    </head>' \
             '    <body>' \
             '        <p>Русский текст</p>' \
             '    </body>' \
             '</html>'

outputFilename = "test.pdf"

def convertHtmlToPdf(sourceHtml, outputFilename):
    resultFile = open(outputFilename, "w+b")
    pisaStatus = pisa.CreatePDF(sourceHtml, dest=resultFile, encoding='UTF-8')
    resultFile.close() 
    return pisaStatus.err

if __name__ == "__main__":
    pisa.showLogging()
    convertHtmlToPdf(sourceHtml, outputFilename)



##from xhtml2pdf import pisa             # import python module
##
### Define your data
##source_html = (
##'''<html>
##<head>
##  <title>test</title>
##</head>
##<body>
##<p>To PDF or not вдаповдалповдлапto PDFskjfhskdjfhlskjfd</p>
##<img src="CAPTCHA.png">
##</body>
##</html>
##''')
##output_filename = "test1.pdf"
##
### Utility function
##def convert_html_to_pdf(source_html, output_filename):
##    # open output file for writing (truncated binary)
##    result_file = open(output_filename, "w+b")
##
##    # convert HTML to PDF
##    pisa_status = pisa.CreatePDF(
##            source_html,                # the HTML to convert
##            dest=result_file)           # file handle to recieve result
##
##    # close output file
##    result_file.close()                 # close output file
##
##    # return False on success and True on errors
##    return pisa_status.err
##
### Main program
##if __name__ == "__main__":
##    pisa.showLogging()
##    convert_html_to_pdf(source_html, output_filename)
