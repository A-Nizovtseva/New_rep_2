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
import random
from xhtml2pdf import pisa 

from global_g import *

from table_show_main import * 

#=================================================
def order_form():
    print('>>>order_form')

    cursor = G.connection.cursor()
    cursor.execute('select top 1 OrderId from "Order" order by OrderId desc;')
    rows = cursor.fetchone()
    last_order_id = rows[0]+1
    
    order_win = QtWidgets.QDialog( parent=G.mainwin )
    order_win.setWindowFlags(QtCore.Qt.Window)
    order_win.setGeometry(0, 0, 500, 500)

    order_box = QtWidgets.QWidget( parent=G.mainwin )
    client_box = QtWidgets.QWidget( parent=G.mainwin )
    service_box = QtWidgets.QWidget( parent=G.mainwin )
    duration_box = QtWidgets.QWidget( parent=G.mainwin )
    button_box = QtWidgets.QWidget( parent=G.mainwin )
#Ввод кода для штрих-кода------
    order_label = QtWidgets.QLabel('Введите номер заказа: ', parent = order_box)    
    order_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    order_label.setFixedHeight(30)

    order_line = QLineEdit(parent = order_box)
    order_line.setFixedHeight(30)
    order_line.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    order_line.setText (str(last_order_id))
    G.order_line = order_line
#"select top 1 * from "Order" order by OrderId desc;" 

    barcode_button = QtWidgets.QPushButton('Сформировать штрих-код', order_box)
    barcode_button.setStyleSheet('font:18px;')
    barcode_button.clicked.connect(barcode_creation)

    order_layout = QHBoxLayout(order_box)
    order_layout.addWidget(order_label)
    order_layout.addWidget(order_line)
    order_layout.addWidget(barcode_button)
    order_box.setLayout(order_layout)
    print(1)

#Выбор клиента--------
    client_label = QtWidgets.QLabel('Клиент: ', parent = client_box)    
    client_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    client_label.setFixedHeight(30)
    client_label.setFixedWidth(100)
    print(1.1)
    client_choice_label = QtWidgets.QLabel('Тут будет имя выбранного клиента ', parent = client_box)    
    client_choice_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    G.client_choice_label = client_choice_label
##    client_choice_label.setFixedHeight(30)

    client_button = QtWidgets.QPushButton('Выбрать', client_box)
    client_button.setStyleSheet('font:18px;')
    client_button.setFixedWidth(100)
    client_button.clicked.connect(table_show)
    print(2)

    client_layout = QHBoxLayout(client_box)
    client_layout.addWidget(client_label)
    client_layout.addWidget(client_choice_label)
    client_layout.addWidget(client_button)
    client_box.setLayout(client_layout)
    
#Выбор услуги---------

    service_label = QtWidgets.QLabel('Услуги: ', parent = service_box)    
    service_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    service_label.setFixedHeight(30)
    service_label.setFixedWidth(100)

    service_choice_label = QtWidgets.QLabel('', parent = service_box)    
    service_choice_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    G.service_choice_label = service_choice_label
##    service_choice_label.setFixedHeight(30)

    service_button = QtWidgets.QPushButton( service_box)
    service_button.setFixedHeight(30)
    service_button.setFixedWidth(30)
    service_button.setStyleSheet("border-image : url(Добавить.png)  0 0 0 0 stretch stretch;")
    service_button.clicked.connect(table_show)
    
    service_layout = QHBoxLayout(service_box)
    service_layout.addWidget(service_label)
    service_layout.addWidget(service_choice_label)
    service_layout.addWidget(service_button)
    service_box.setLayout(service_layout)
#Указание времени-----------
    duration_label = QtWidgets.QLabel('Введите время проката: ', parent = duration_box)    
    duration_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    duration_label.setFixedHeight(30)

    duration_line = QLineEdit(parent = duration_box)
    duration_line.setFixedHeight(30)
    duration_line.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    G.duration_line = duration_line

    duration_layout = QHBoxLayout(duration_box)
    duration_layout.addWidget(duration_label)
    duration_layout.addWidget(duration_line)
    duration_box.setLayout(duration_layout)

    
#Кнопка подтверждения-----------
    confirm_button = QtWidgets.QPushButton('Сформировать заказ', button_box)
    confirm_button.clicked.connect(order_creating)

    button_layout = QHBoxLayout(button_box)
    button_layout.addWidget(confirm_button)
    button_box.setLayout(button_layout)
#-----------------------------    
    order_main_layout = QVBoxLayout(order_win)
    order_main_layout.addWidget(order_box)
    order_main_layout.addWidget(client_box)
    order_main_layout.addWidget(service_box)
    order_main_layout.addWidget(duration_box)
    order_main_layout.addWidget(button_box)
    order_win.setLayout(order_main_layout)
    order_win.exec_()
    
    print('<<<order_form')

#=================================================
def barcode_creation():

    order_number = G.order_line.text()   
    dtn = str(datetime.now())
    order_datetime = dtn[0:4]+dtn[5:7]+dtn[8:10]+dtn[11:13]+dtn[14:16]
    order_duration = G.duration_line.text()
    order_random = str(random.randint(111111, 999999))

    number = order_number + order_datetime + order_duration + order_random
    print(number)

    my_code = EAN13(number, writer=ImageWriter())
    if os.path.exists("./barcode.png"):
        os.remove("./barcode.png")
    my_code.save("barcode")

    html_text = (
    '''
    <html>
    <body>
    <img src="./barcode.png">
    </body>
    </html>
    ''')    
    result_file = open("barcode.pdf", "w+b")     
    pisa_status = pisa.CreatePDF(html_text, dest=result_file)
    result_file.close() 
    
    
#=================================================
def order_creating():
    print('>>>order_creating')

    order_datetime = str(datetime.now())
    order_client_code = G.client_choice_label.text()
    order_number = G.order_line.text()
    order_services = G.service_choice_label.text()
    order_duration = G.duration_line.text()
    
    order_date = order_datetime[0:10]
    order_time = order_datetime[11:19]

    sql_command_insert = 'insert into "Order" '+\
    '(OrderId, OrderCode,OrderDate,OrderTime,ClientCode,OrderStatus,OrderClosingDate,OrderRentTime) values '+\
    "("+order_number+", '"+order_client_code+'/'+order_date+"','"+order_date+"','"+order_time+"', "+order_client_code+\
    ", 'В прокате', NULL, "+order_duration+");"

    sql_command_select = "select concat(ClientSurname,' ', ClientName,' ', ClientPatronymic), "+\
        "concat(ClientAddressIndex, ', ', ClientCity,', ',ClientStreet,', ',ClientHouse,', ',ClientFlat) "+\
                  "from Client where ClientCode = "+order_client_code+";"
    print(sql_command_insert)
    print(sql_command_select)
    
    cursor = G.connection.cursor()
    cursor.execute(sql_command_insert)
    G.connection.commit()

    cursor = G.connection.cursor()
    cursor.execute(sql_command_select)
    row = cursor.fetchone()

    order_FIO = str(row[0])
    order_address = str(row[1])

    services_list = order_services.split('; ')
    
    for service in range(len(services_list)-1):
        print(service)
        print(services_list[service])
        sql_orderservice_insert = 'insert into "OrderService" (OrderId,ServiceId) values ('+\
                                  order_number+ ', '+services_list[service]+');'
        print(sql_orderservice_insert)
        cursor = G.connection.cursor()
        cursor.execute(sql_orderservice_insert)
        G.connection.commit()
        print('done')
        
    sql_sum_select = "select sum(sum_1) from ( select (select ServiceCost from "+\
            'Service where Service.ServiceId = service_list.ServiceId) * '+\
            '(select OrderRentTime from "Order" where OrderId = '+order_number+') as sum_1'+\
            " from (select * from OrderService where OrderId = "+order_number+") as service_list ) as final_sum;"

    print(sql_sum_select)
    cursor = G.connection.cursor()
    cursor.execute(sql_sum_select)
    row = cursor.fetchone()

    order_final_sum = str(row[0])

    print('------------------------')
    print(order_datetime)
    print(order_client_code)
    print(order_number)
    print(order_FIO)
    print(order_address)
    print(order_services)    
    print(order_final_sum)

    html_text = ('<html><head><META charset="utf-8">'+'''
                    <style>
                    p {
                    color: blue;
                    font-size: 19px;
                    width: 60%;
                    }
                    </style></head>'''+\
                 '<body><p>Order date: '+order_datetime+'</p>'+\
                 '<p>Client code: '+order_client_code+'</p>'+\
                 '<p>Order code: '+order_number+'</p>'+\
                 '<p>Client name: '+order_FIO+'</p>'+\
                 '<p>Client address: '+order_address+'</p>'+\
                 '<p>Services: '+order_services+'</p>'+\
                 '<p>Final price: '+order_final_sum+'</p>'+\
                 '</body></html>')
    print(html_text)
    result_file = open("Электронный вид заказа.pdf", "w+b")     
    pisa_status = pisa.CreatePDF(html_text, dest=result_file, encodind='UTF-8')
    result_file.close()
    
#insert into "Order" (OrderCode,OrderDate,OrderTime,ClientCode,OrderStatus,OrderClosingDate,OrderRentTime) values ('1','01-01-01','12:00:00', 45462599, '1', '01-01-01',5);    
#"select concat(ClientSurname,' ', ClientName,' ', ClientPatronymic) from Client where ClientCode = "
#select concat(ClientSurname,' ', ClientName,' ', ClientPatronymic), concat(ClientAddressIndex, ', ', ClientCity,', ',ClientStreet,', ',ClientHouse,', ',ClientFlat) from Client where ClientCode =    
    
 
