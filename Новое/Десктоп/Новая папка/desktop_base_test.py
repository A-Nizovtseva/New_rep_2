import os, configparser, sys, time, pyodbc
from PyQt5 import QtCore, QtGui, QtWidgets, QtSql, Qt
from PyQt5.QtWidgets import (QWidget, QPushButton, QLabel, QTableWidget, QAbstractItemView,
QLineEdit, QComboBox, QApplication, QHeaderView, QTableWidgetItem, QHBoxLayout, 
QVBoxLayout, QCheckBox, QDialog)
from PyQt5.QtGui import QPixmap, QFont
from datetime import datetime
from PyQt5.QtCore import QTimer, QTime, Qt
from barcode import EAN13
from barcode.writer import ImageWriter

from global_g import *

from table_show_main import *
from order_window_test import *
from desktop_login_test import *


#=================================================
def main(win1):

    print('>>>main')

##    G.connection = pyodbc.connect(driver='{ODBC Driver 17 for SQL Server}',
##                      server='HARZA-N\SQLEXPRESS', 
##                      database='bd_dem',               
##                      trusted_connection='yes')


    def showTime():
        
        current_time = datetime.strptime(time.strftime("%H:%M:%S"),"%H:%M:%S")
        
        time_interval = current_time - G.starting_time

        G.timer_label.setText( str(time_interval) )
        G.timer_label.show()

        if str(time_interval) >= '0:10:00':
            G.timer.stop()
            G.mainwin.close()
            print('5 секунд')

        if str(time_interval) == '0:05:00':
            print('предупреждение')
            info_message = QtWidgets.QMessageBox()
            info_message.setWindowTitle("Внимание")
            info_message.setText("Время сеанса подходит к концу!")
            info_message.setIcon(2)
            info_message.exec_()

        if str(time_interval) == '0:07:00':
            G.login_block = 1
      
        print(str(time_interval))

        print('время: '+time.strftime("%H:%M:%S"))
        return
        
    G.login_block = 0
    G.mainwin = win1
    G.type_sort = 'UserId'
    G.username = ''
    G.sort_type = ''
    G.text_to_find = ''

    top_label = QtWidgets.QWidget(parent = G.mainwin)
    
    win1.setGeometry(50, 50, 900, 725)

    G.timer_label = QLabel(parent = G.mainwin)
    G.timer_label.setAlignment(Qt.AlignCenter)
    G.timer_label.setGeometry(0, 0, 200, 200)

    G.timer = QTimer(win1)
    G.timer.timeout.connect( showTime )
##    G.timer.start(1000)                           

    G.starting_time = datetime.strptime(time.strftime("%H:%M:%S"),"%H:%M:%S")
    
    pixmap_widget = QWidget(parent = top_label)
    pixmap = QPixmap("D:\Прочее\Учеба\дэ\Новое\Импорт переделанный\Сотрудники_import\Игнатов.jpeg")    
    pix_label = QLabel(parent = pixmap_widget)
    pix_label.setPixmap(pixmap)

    label_name = QtWidgets.QLabel('Имя: ' + str(G.user_name)+
                                  '\nФамилия: '+str(G.user_surname)+
                                  '\nРоль: '+str(G.user_type), parent = top_label)    
##    label_name.setStyleSheet(
##        'border-color:black; border-width:1px;border-style:solid;' + \
##        'background:white; color:black;' +\
##        'font:15px;')
    label_name.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;' )
##    label_name.setGeometry( 0, 50, 900, 50 )
    label_name.setAlignment( QtCore.Qt.AlignLeft )
    label_name.setAlignment( QtCore.Qt.AlignVCenter )
    G.label_name = label_name

    esc_button = QtWidgets.QPushButton('Выход (ESC)', win1)
    esc_button.setStyleSheet('font:18px;')
    esc_button.setGeometry( 0, 0, 100, 50 )
    esc_button.clicked.connect(on_esc)

    top_layout = QtWidgets.QHBoxLayout()    
    top_layout.addWidget( pix_label, alignment = QtCore.Qt.AlignTop  )
    top_layout.addWidget( label_name, alignment = QtCore.Qt.AlignTop  )
    top_layout.addWidget( G.timer_label, alignment = QtCore.Qt.AlignTop  )
    top_layout.addWidget( esc_button, alignment = QtCore.Qt.AlignTop  )    
    top_label.setLayout( top_layout )
    
    G.top_label = top_label
    
    button_draw(win1)

    main_layout_form(win1)
    
    win1.show()
    print('<<<main')
    return

###=================================================
##def on_Esc():
##    G.timer_label.setText(time.strftime("%H:%M:%S"))

#=================================================
def main_layout_form(win):

    mainLayout = QtWidgets.QVBoxLayout()
##    G.layout = mainLayout
##    mw0.vlay.addWidget( mw0.inf, alignment = QtCore.Qt.AlignTop )
    mainLayout.addWidget( G.top_label, alignment = QtCore.Qt.AlignTop  )
    mainLayout.addWidget( G.button_core_win, alignment = QtCore.Qt.AlignTop )
    
    win.setLayout( mainLayout )

#========================================
def button_draw(win2):
    print('>>>button_draw')

    button_core_win = QtWidgets.QWidget(parent = win2)

    button_width = 150
    button_height = 50

    button_layout = QtWidgets.QHBoxLayout(button_core_win)
    button_core_win.setLayout(button_layout)
    G.button_core_win = button_core_win

    if G.user_type == 'Продавец' or G.user_type == 'Старший смены':       
        order_button = QtWidgets.QPushButton('Формирование заказа', parent = win2)
        order_button.setStyleSheet('font:18px;')
        order_button.clicked.connect(order_form)
        button_layout.addWidget(order_button)

    if G.user_type == 'Старший смены':
        product_f_button = QtWidgets.QPushButton('Прием товара', parent = win2)
        product_f_button.setStyleSheet('font:18px;')
        button_layout.addWidget(product_f_button)

    if G.user_type == 'Администратор':
    
        history_button = QtWidgets.QPushButton('История входа', parent = win2)
        history_button.setStyleSheet('font:18px;')
        history_button.clicked.connect(table_show)

        report_button = QtWidgets.QPushButton('Формирование отчета', parent = win2)
        report_button.setStyleSheet('font:18px;')
        
        consum_f_button = QtWidgets.QPushButton('Данные о расходных материалах', parent = win2)
        consum_f_button.setStyleSheet('font:18px;')
        
        button_layout.addWidget(history_button)
        button_layout.addWidget(report_button)
        button_layout.addWidget(consum_f_button)

    print('<<<button_draw')

#========================================
def on_esc():
    G.mainwin.hide()
    login_complete = login_login(G.mainwin)
    G.mainwin.show()
##    if login_complete == 0 :
##        print('G.login == 0')
##        sys.exit()
##    elif 1:
    
##        return
##        G.mainwin_login.hide()
####        G.mainwin_login.close()
##        main_window = QtWidgets.QLabel()
##        main_window.setFocus()
##        main(main_window)
##        choice_menu(G.mainwin_login)
##    elif 0: pass       


#========================================
##core_app = QtWidgets.QApplication(sys.argv)
##
####main_window = main_class_label()
##main_window = QtWidgets.QLabel()
####main_window.setStyleSheet('background:#FFFFFF;')
##main(main_window)
##
##sys.exit(core_app.exec_())

