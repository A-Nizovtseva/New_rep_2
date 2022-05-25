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

##from desktop_base_test import *

##class globaldata:
##    pass
##
##global G
##G = globaldata()

#=================================================
def login_main(win):
    
    print('login_main')

    G.mainwin_login = win
    window_width = 1000
    window_hight = 800
##    login_menu()
##    win.hide()

    G.users = None
    G.orgn = None
    G.login = 0
    G.mainLayout = QtWidgets.QVBoxLayout()
    win.setLayout( G.mainLayout )

    screen = app.primaryScreen()
    pos_width = (screen.size().width()-window_width)//2
    pos_height = (screen.size().height()-window_hight)//2    
    win.setGeometry(pos_width, pos_height, window_width, window_hight)
    
    login_menu()
    
#=================================================
def login_menu():
    print('login_menu')

    login_login(G.mainwin_login)

    if G.login == 0 :
        print('G.login == 0')
        sys.exit()
        return
    elif 1:
        G.mainwin_login.hide()
        choice_menu(G.mainwin_login)
    elif 0: pass

###=================================================
##def choice_menu(win):
##    print('choice_menu')
##
##    choice_box = QtWidgets.QLabel(parent=win )
##
##    window_width = 400
##    window_hight = 400
##
##    pos_width = (win.width()-window_width)//2
##    pos_height = (win.height()-window_hight)//2  
##    choice_box.setGeometry(pos_width, pos_height, window_width, window_hight)    
##
##    label_choice = QtWidgets.QLabel('Открыть таблицу:', parent=choice_box)
##    label_choice.setStyleSheet('color:black;font:25px;font-weight:bold;')   
##    label_choice.setGeometry((window_width-250)//2, 10, 250, 50)
##    label_choice.setAlignment( QtCore.Qt.AlignCenter )
##
##    users_button = QtWidgets.QPushButton('Пользователи', choice_box)
##    users_button.setStyleSheet('font:20px;')
##    users_button.setGeometry((window_width-200)//2, 100, 200, 50)
##    users_button.clicked.connect(table_choice)
##
##    users_button = QtWidgets.QPushButton('Организации', choice_box)
##    users_button.setStyleSheet('font:20px;')
##    users_button.setGeometry((window_width-200)//2, 200, 200, 50)
##    users_button.clicked.connect(table_choice)
##
##    users_button = QtWidgets.QPushButton('Медтовары', choice_box)
##    users_button.setStyleSheet('font:20px;')
##    users_button.setGeometry((window_width-200)//2, 300, 200, 50)
##    users_button.clicked.connect(table_choice)
##
##    choice_box.show()
##    
###=================================================
##def table_choice():
##    print(table_choice)
##    sender = G.mainwin_login.sender()
##    print(sender)
##
##    if sender.text() == 'Пользователи':
##        print(str(G.users)+' - G.users')
##        G.users = keyEvent_Change_users( G.mainwin_login )
##        print(str(G.users)+' - G.users')
####        G.mainLayout.addWidget( G.users, alignment = QtCore.Qt.AlignTop )
##        label_test = QtWidgets.QLabel('\n\n\n\n\n label-test\n', parent = G.mainwin_login )
##        G.mainLayout.addWidget( label_test, alignment = QtCore.Qt.AlignTop )
##        G.users.show()       
##    elif sender.text() == 'Организации':
##        print(str(G.orgn)+' - G.orgn')
##        G.orgn = keyEvent_Change_orgn( G.mainwin_login )
##        G.mainLayout.addWidget( G.orgn, alignment = QtCore.Qt.AlignTop )
##        G.orgn.show()  
##        print('орг')
##    elif sender.text() == 'Медтовары':
##        print('медт')
        
        
#=================================================
def login_login(win):
    print('login_login')
    
    login_box = QtWidgets.QDialog ( parent=win )
    G.login_box = login_box
    
    window_width = 800
    window_hight = 300
    
    screen = app.primaryScreen()
    pos_width = (screen.size().width()-window_width)//2
    pos_height = (screen.size().height()-window_hight)//2    
    login_box.setGeometry(pos_width, pos_height, window_width, window_hight)

    label_login = QtWidgets.QLabel('Введите логин:', parent=login_box)
    label_login.setStyleSheet('color:black;font:25px;font-weight:bold;')   
    label_login.setGeometry( 0, 25, 250, 50)
    label_login.setAlignment( QtCore.Qt.AlignCenter )

    G.text_login = QtWidgets.QLineEdit(parent=login_box)
    G.text_login.setStyleSheet('font:22px;')
    G.text_login.setGeometry( 250, 25, window_width-250, 50 )    

    label_pass = QtWidgets.QLabel('Введите пароль:', parent = login_box)
    label_pass.setStyleSheet('font:25px;font-weight:bold;')
    label_pass.setGeometry( 0, 125, 250, 50 )
    label_pass.setAlignment( QtCore.Qt.AlignCenter )

    G.text_pass = QtWidgets.QLineEdit(parent=login_box)
    G.text_pass.setStyleSheet('font:22px;')
    G.text_pass.setEchoMode(2)
    G.text_pass.setGeometry( 250, 125, window_width-250, 50 )
    
    enter_button = QtWidgets.QPushButton('Войти', login_box)
    enter_button.setStyleSheet('font:20px;')
    enter_button.setGeometry( 250, 200, 200, 50 )
    enter_button.clicked.connect(login_check)

    G.show_pass_button = QtWidgets.QPushButton('Показать пароль', login_box)
    G.show_pass_button.setStyleSheet('font:20px;')
    G.show_pass_button.setGeometry( 500, 200, 200, 50 )
    G.show_pass_button.setCheckable(True)
    G.show_pass_button.clicked.connect(login_show_pass)
#G.login_box ????????????????
    login_box.exec_()

#=================================================
def login_check():
    print('login_check')
    
    user_login = G.text_login.text()
    user_pass = G.text_pass.text()
    print(1)
    db_login_check = "select * from Employee where EmployeeLogin = '" + user_login + "';"
    
    print(2)
    cursor = G.connection.cursor()
    print(3)
    cursor.execute(db_login_check)
    rows = cursor.fetchall()
    
    print(rows)
    if rows != []:
        db_type = rows[0][1]
        db_login = rows[0][5]
        db_pass = rows[0][6]

        G.user_type = db_type
    
        print(db_type, '- db_type')
        print(db_login, '- db_login')
        print(db_pass, '- db_pass')

    info_message = QtWidgets.QMessageBox()

    if (rows == [])or(db_pass != user_pass)or(user_login == ''):
        info_message.setWindowTitle("Ошибка")
        info_message.setText("Неверный логин или пароль")
        info_message.setIcon(3)
        info_message.exec_()
        G.login = 0
    elif 1:
        G.login = 1
        G.login_box.close()
    elif 0: pass

#=================================================
def login_show_pass():
    print('show_pass')
    
    text = G.show_pass_button.text()
    if text == 'Показать пароль':
        G.text_pass.setEchoMode(0)
        G.show_pass_button.setText('Скрыть пароль')
    elif 1:
        G.show_pass_button.setText('Показать пароль')
        G.text_pass.setEchoMode(2)
    elif 0: pass

#=================================================
if __name__ == "__main__":
    
    app = QtWidgets.QApplication(sys.argv)

    con1 = QtSql.QSqlDatabase.addDatabase ('QSQLITE')
    con1.setDatabaseName('forg0.db')
    con1.open()
    if con1.lastError().isValid():
        YNC( con1.lastError().text(), parent=None )
        con1.close()
        #return
    elif 0: pass
    
    window = QtWidgets.QLabel()
    
    login_main(window)
    window.show()

    yyyy = app.exec_()
