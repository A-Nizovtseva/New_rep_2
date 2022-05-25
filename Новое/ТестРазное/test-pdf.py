from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *
from PyQt5.QtWebKitWidgets import *
##from PyQt5.QtWebKitWidgets import QWebView , QWebPage
from PyQt5.QtWebKit import *

import sys

# основная процедура
def html2pdf(f_url, f_name):
    # создаем QT приложение
    app = QApplication(sys.argv)

    # создаем "браузер"
    web = QWebView()
    # передаем URL для загрузки
    web.load(QUrl(f_url))
    
    # создаем принтер
    printer = QPrinter()
    # размер листа
    printer.setPageSize(QPrinter.A4)
    # формат печати 
    printer.setOutputFormat(QPrinter.PdfFormat)
    # выходной файл печати
    printer.setOutputFileName(f_name)
    
    # непосредственно печать содержимого "браузера" в PDF
    def convertIt():
        web.print_(printer)
        QApplication.exit()

    # ждем сигнал от браузера, что страница загружена, после чего "печатаем" PDF
    QObject.connect(web, SIGNAL("loadFinished(bool)"), convertIt)
    sys.exit(app.exec_())


html2pdf( '111.html',  '222.pdf' )
