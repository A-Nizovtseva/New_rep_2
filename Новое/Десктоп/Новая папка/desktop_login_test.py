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
import secrets
import string
from captcha.image import ImageCaptcha

from global_g import *

from desktop_base_test import *

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

    G.login = 0
    G.failed_attempts = 0
    
    G.mainLayout = QtWidgets.QVBoxLayout()
    win.setLayout( G.mainLayout )

    screen = app.primaryScreen()
    pos_width = (screen.size().width()-window_width)//2
    pos_height = (screen.size().height()-window_hight)//2    
    win.setGeometry(pos_width, pos_height, window_width, window_hight)
    
    login_complete = login_login(win)

    main_window = QtWidgets.QLabel()
    main_window.setFocus()
    main(main_window)


##    if login_complete == 0 :
####        print('G.login == 0')
####        sys.exit()
##        pass
##    elif 1:
####        G.mainwin_login.hide()
####        G.mainwin_login.close()
####        choice_menu(G.mainwin_login)
##    elif 0: pass       
        
#=================================================
def login_login(win):
    print('>>>login_login')
    
    login_win = QtWidgets.QDialog ( parent=win )
    G.login_win = login_win

    login_box = QtWidgets.QWidget ( parent=win )
    password_box = QtWidgets.QWidget ( parent=win )
    button_box = QtWidgets.QWidget ( parent=win )
    G.button_box = button_box
    
    window_width = 800
    window_hight = 300
    print(1)
##    screen = app.primaryScreen()
##    pos_width = (screen.size().width()-window_width)//2
##    pos_height = (screen.size().height()-window_hight)//2    
##    login_win.setGeometry(pos_width, pos_height, window_width, window_hight)
    print(1.1)

    label_login = QtWidgets.QLabel('Введите логин:', parent=login_win)
    label_login.setStyleSheet('color:black;font:25px;font-weight:bold;')   
    label_login.setGeometry( 0, 25, 250, 50)
    label_login.setAlignment( QtCore.Qt.AlignCenter )
    print(1.2)

    G.text_login = QtWidgets.QLineEdit(parent=login_win)
    G.text_login.setStyleSheet('font:22px;')
    G.text_login.setGeometry( 250, 25, window_width-250, 50 )
    print(1.3)

    label_pass = QtWidgets.QLabel('Введите пароль:', parent = login_win)
    label_pass.setStyleSheet('font:25px;font-weight:bold;')
    label_pass.setGeometry( 0, 125, 250, 50 )
    label_pass.setAlignment( QtCore.Qt.AlignCenter )
    print(1.4)

    G.text_pass = QtWidgets.QLineEdit(parent=login_win)
    G.text_pass.setStyleSheet('font:22px;')
    G.text_pass.setEchoMode(2)
    G.text_pass.setGeometry( 250, 125, window_width-250, 50 )
    print(1.5)
    
    enter_button = QtWidgets.QPushButton('Войти', login_win)
    enter_button.setStyleSheet('font:20px;')
    enter_button.setGeometry( 250, 200, 200, 50 )
    enter_button.clicked.connect(login_check)
    print(1.6)

    G.show_pass_button = QtWidgets.QPushButton('Показать пароль', login_win)
    G.show_pass_button.setStyleSheet('font:20px;')
    G.show_pass_button.setGeometry( 500, 200, 200, 50 )
    G.show_pass_button.setCheckable(True)
    G.show_pass_button.clicked.connect(login_show_pass)
    print(2)

    
    login_enter_layout = QtWidgets.QHBoxLayout(login_box)
    login_enter_layout.addWidget(label_login)
    login_enter_layout.addWidget(G.text_login)
    login_box.setLayout(login_enter_layout)
    print(3)
    password_enter_layout = QtWidgets.QHBoxLayout(password_box)
    password_enter_layout.addWidget(label_pass)
    password_enter_layout.addWidget(G.text_pass)
    password_box.setLayout(password_enter_layout)

    button_layout = QtWidgets.QHBoxLayout(button_box)
    button_layout.addWidget(enter_button)
    button_layout.addWidget(G.show_pass_button)
    button_box.setLayout(button_layout)

    G.login_main_layout = QtWidgets.QVBoxLayout(login_win)
    G.login_main_layout.addWidget(login_box)
    G.login_main_layout.addWidget(password_box)
    G.login_main_layout.addWidget(button_box)
    login_win.setLayout(G.login_main_layout)
   
    login_win.exec_()

    return G.login
    print('<<<login_login')
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
        db_surname = rows[0][2]
        db_name = rows[0][3]
        db_patronymic = rows[0][4]
        db_login = rows[0][5]
        db_pass = rows[0][6]

        G.user_type = db_type
        G.user_surname = db_surname
        G.user_name = db_name
        G.user_patronymic = db_patronymic
    
        print(db_type, '- db_type')
        print(db_login, '- db_login')
        print(db_pass, '- db_pass')

    info_message = QtWidgets.QMessageBox()

    if (rows == [])or(db_pass != user_pass)or(user_login == ''):
        info_message.setWindowTitle("Ошибка")
        info_message.setText("Неверный логин или пароль")
        info_message.setIcon(3)
        info_message.exec_()
        G.failed_attempts = G.failed_attempts + 1
        print(str(G.failed_attempts))
        G.login = 0
        if G.failed_attempts == 2:
            G.failed_attempts = 0
            captcha_check()
            os.remove("./captcha.png")
    elif 1:
        G.login = 1
        G.login_win.close()
    elif 0: pass
#=================================================
def captcha_check():
    print('>>>captcha_check')

    G.button_box.hide()
    
    letters_and_digits = string.ascii_letters + string.digits
    captcha_text = ''
    for symbol in range(3):
        captcha_text = captcha_text + secrets.choice(letters_and_digits)
    print(captcha_text)
    G.captcha_text = captcha_text
    
    captcha = ImageCaptcha()
    captcha_image = captcha.generate_image(captcha_text)
    captcha.create_noise_curve(captcha_image, captcha_image.getcolors())
    captcha.create_noise_dots(captcha_image, captcha_image.getcolors())
    
    captcha_file = "./captcha.png"
    if os.path.exists(captcha_file):
        os.remove(captcha_file)
    captcha.write(captcha_text, captcha_file)


    G.captcha_box = QWidget(parent = G.login_win)

    pixmap_widget = QWidget(parent = G.login_win)
    pixmap = QPixmap("./captcha.png")    
    pix_label = QLabel(parent = pixmap_widget)
    pix_label.setPixmap(pixmap)

    G.answer_line = QtWidgets.QLineEdit(parent=G.login_win)

    captha_button = QtWidgets.QPushButton('Ввести', G.login_win)
    captha_button.clicked.connect(answer_captcha_check)

    captcha_layout = QtWidgets.QHBoxLayout(G.captcha_box)
    captcha_layout.addWidget(pix_label)
    captcha_layout.addWidget(G.answer_line)
    captcha_layout.addWidget(captha_button)
    G.captcha_box.setLayout(captcha_layout)

    G.login_main_layout.addWidget(G.captcha_box)

    print('<<<captcha_check')
#=================================================
def answer_captcha_check():
    print('>>>answer_captcha_check')

    print(G.answer_line.text(), '- G.answer_line.text()')
    print(G.captcha_text, '- G.captcha_text')

    if G.answer_line.text() == G.captcha_text:
        G.login_main_layout.removeWidget(G.captcha_box)
        G.captcha_box.close()
        G.button_box.show()
        print('<answer_captcha_check')
        return
    else:
        print('не совпали')
        info_message = QtWidgets.QMessageBox()
        info_message.setWindowTitle("Ошибка")
        info_message.setText("Ответ неверный")
        info_message.setIcon(3)
        info_message.exec_()
        print('captcha_check()')
        G.login_main_layout.removeWidget(G.captcha_box)
        captcha_check()

    print('<<<answer_captcha_check')
        
    
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
    
    window = QtWidgets.QLabel()
    
    login_main(window)
##    window.show()
    window.hide()

    yyyy = app.exec_()
