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

#=================================================
def table_show():

    print('>>>table_show')

    sender = G.mainwin.sender()
    print(1)
    G.sender = sender
    sender_text = sender.text()
    print(sender_text, '- sender_text')

    header_list = []

    if sender_text == "Выбрать":
        header_list = ['Id пользователя', 'Фамилия', 'Имя', 'Отчество', 'Серия', 'Номер',
                       'Дата рождения','Индекс','Город','Улица','Дом','Квартира','Логин','Пароль']
        G.column_count = 14
    elif sender_text == "":
        header_list = ['Id услуги', 'Название', 'Код', 'Стоимость']
        G.column_count = 4
    elif sender_text == "История входа":
        header_list = ['Id записи','Логин', 'Время входа', 'Успешный вход(0/1)']
        G.column_count = 4
    
    print(header_list)
    print(G.column_count)
    
    table_win = QtWidgets.QDialog( parent=G.mainwin )
    table_win.setWindowFlags(QtCore.Qt.Window)
    G.table_win = table_win
    
#Верхний уровень - Поиск, Сортировка
    top_box = QtWidgets.QWidget( parent=G.mainwin )

    find_label = QtWidgets.QLabel('Поиск:', parent = top_box)    
    find_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    find_label.setFixedHeight(30)
    find_label.setFixedWidth(50)
    print(1)
    find_line = QLineEdit(parent = G.mainwin)
    find_line.setFixedHeight(30)
    find_line.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    find_line.textChanged[str].connect(on_finding_activated)
    print(2)
    sort_label = QtWidgets.QLabel('Сортировка:', parent = top_box)    
    sort_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    sort_label.setFixedHeight(30)
    sort_label.setFixedWidth(100)
    print(3)
    sorting_box = QComboBox(parent=G.mainwin)
    sorting_box.setFixedHeight(30)
    sorting_box.setStyleSheet( 'font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    sorting_box.addItems(header_list)
    sorting_box.activated[str].connect(on_sorting_activated)
    print(4)
    top_table_layout = QHBoxLayout(top_box)
    top_table_layout.addWidget(find_label)
    top_table_layout.addWidget(find_line)
    top_table_layout.addWidget(sort_label)
    top_table_layout.addWidget(sorting_box)
    top_box.setLayout(top_table_layout)
    
#Средний уровень- Таблица   
    G.tableUsers = QtWidgets.QTableWidget( G.mainwin )
    G.tableUsers.setColumnCount(G.column_count)
##    G.tableUsers.setColumnWidth( 0, 100 )
    G.tableUsers.setHorizontalHeaderLabels( header_list )
    G.tableUsers.setGeometry( 0, 100, 900, 650 )

    G.tableUsers.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
    G.tableUsers.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows)
    G.tableUsers.setSelectionMode(QtWidgets.QAbstractItemView.SingleSelection)
    G.tableUsers.verticalHeader().hide()

    G.tableUsers.show()
    G.tableUsers.setFocus() 

    for i in range(G.column_count):
        G.tableUsers.horizontalHeader().setSectionResizeMode(i, QtWidgets.QHeaderView.Stretch)

    table_fill(G.tableUsers)

    table_layout = QVBoxLayout(table_win)
    table_layout.addWidget(top_box)
    table_layout.addWidget(G.tableUsers)

#Нижний уровень - Кнопка
    if G.sender.text() != 'История входа':
        bottom_box = QtWidgets.QWidget( parent=G.mainwin )

        confirm_button = QtWidgets.QPushButton('Подтвердить', bottom_box)
        confirm_button.setFixedHeight(30)
        confirm_button.setStyleSheet('font:18px;')
        confirm_button.clicked.connect(on_adding_activated)
       
        bottom_table_layout = QHBoxLayout(bottom_box)
        bottom_table_layout.addWidget(confirm_button)
        bottom_box.setLayout(bottom_table_layout)

        if G.sender.text() == "Выбрать":
            add_client_button = QtWidgets.QPushButton('Добавить клиента', bottom_box)
            add_client_button.setFixedHeight(30)
            add_client_button.setStyleSheet('font:18px;')
            add_client_button.clicked.connect(adding_client)
            
            bottom_table_layout.addWidget(add_client_button)
            
        table_layout.addWidget(bottom_box)

#Сборка полностью в один Layout   
    table_win.setLayout(table_layout)
    table_win.exec_()

#=================================================
def on_finding_activated(text):
    print('>>>onFindingActivated')

    G.text_to_find = text

    sql_exe = " where charindex('" +G.text_to_find+ "', " +G.sort_type+ ") > 0"+\
                  " order by " +G.sort_type+ ";"

    table_fill(G.tableUsers, sql_exe)

    print('<<<onFindingActivated')

#=================================================
def on_sorting_activated(text):
    print('>>>onSortingActivated')
    print(text)

##    sender = G.mainwin.sender()
##    sender_text = sender.text()
##    print(sender_text)

    header_list = {'Id пользователя':'ClientCode',
                   'Фамилия':'ClientSurname',
                          'Имя':'ClientName',
                          'Отчество':'ClientPatronymic',
                          'Серия':'ClientPassSeries',
                          'Номер':'ClientPassNumber',
                          'Дата рождения':'ClientBirthDate',
                          'Индекс':'ClientAddressIndex',
                          'Город':'ClientCity',
                          'Улица':'ClientStreet',
                          'Дом':'ClientHouse',
                          'Квартира':'ClientFlat',
                          'Логин':'ClientEmail',
                          'Пароль':'ClientPassword',
                            
                           'Id услуги':'ServiceId',
                           'Название':'ServiceName',
                           'Код':'ServiceCode',
                           'Стоимость':'ServiceCost',

                            'Id записи':'LogId',
                           'Логин':'EmployeeLogin',
                           'Время входа':'LogDateTime',
                           'Успешный вход(0/1)':'LogIsSuccessful'}

    G.sort_type = header_list.get(text)
    print(G.sort_type)

    if G.text_to_find == '':
        sql_exe = " order by " +G.sort_type+ ";"
    else:
        sql_exe = " where charindex('" +G.text_to_find+ "', " +G.sort_type+ ") > 0"+\
                  " order by " +G.sort_type+ ";"

    print(sql_exe)

    table_fill(G.tableUsers, sql_exe)
    
    print('<<<onSortingActivated')

#=================================================
def on_adding_activated():

    print('>>>on_adding_activated')
    
    row_id = G.tableUsers.currentIndex().row()  
    table_id = G.tableUsers.item(row_id, 0).text()
    
    if G.sender.text() == "Выбрать":
        G.client_choice_label.setText(str(table_id))
    elif G.sender.text() == "":
        old_text = G.service_choice_label.text()
        new_text = old_text + str(table_id) + '; '
        G.service_choice_label.setText(new_text)
        
    G.table_win.close()

    print('<<<on_adding_activated')

#=================================================
def table_fill(tb, sql_exe = ';'):
    print('>>>table_fill=====================')
    print(G.column_count, '- column_count')

    material_type_list = []

    if G.sender.text() == '':
        sql_exe = "select * from Service" + sql_exe
        if G.sort_type == '':            
            sql_exe = "select * from Service order by ServiceId;"
            G.sort_type = 'ServiceId'
        
    elif G.sender.text() == 'Выбрать':
        sql_exe = "select * from Client" + sql_exe
        if G.sort_type == '':
            sql_exe = "select * from Client order by ClientCode;"
            G.sort_type = 'ClientCode'
    elif G.sender.text() == 'История входа':
        sql_exe = "select * from EmployeeLogHistory" + sql_exe
        if G.sort_type == '':
            sql_exe = "select * from EmployeeLogHistory order by EmployeeLogin;"
            G.sort_type = 'LogId'

    print(G.sort_type)
    print(sql_exe)

    print(0)    
    cursor = G.connection.cursor()
    cursor.execute(sql_exe)
    rows = cursor.fetchall()
    print(rows, '- rows')
    tb.setRowCount(0)
    print(1)
    
    for empty_row in range( len(rows) ):

        tb.insertRow(empty_row)
        
        for cell_num in range(G.column_count):
            
            cell = QtWidgets.QTableWidgetItem (str(rows[empty_row][cell_num])) # Заполн. поле N 0
            tb.setItem (empty_row, cell_num , cell)

        continue
    
##    G.tableUsers.setFocus()

    print('<<<table_fill=====================')

#=================================================
def adding_client():
    print('>>>adding_client')

    main_adding_win = QtWidgets.QDialog( parent=G.mainwin )
    main_adding_win.setWindowFlags(QtCore.Qt.Window)
    main_adding_win.setStyleSheet('font:13px;font-family: Comic Sans MS; background:#FFFFFF;')
    G.main_adding_win = main_adding_win
    print(1)

    input_box = QtWidgets.QWidget( parent=G.mainwin )    
    label_box = QtWidgets.QWidget( parent=G.mainwin )
    line_box = QtWidgets.QWidget( parent=G.mainwin )    
    button_box = QtWidgets.QWidget( parent=G.mainwin )
#---------------    
##    label_id            = QtWidgets.QLabel('Код клиента:', parent = label_box)    
    label_surname       = QtWidgets.QLabel('Фамилия:', parent = label_box)
    label_name          = QtWidgets.QLabel('Имя:', parent = label_box)
    label_patronymic    = QtWidgets.QLabel('Отчество:', parent = label_box)
    label_series        = QtWidgets.QLabel('Серия:', parent = label_box)
    label_number        = QtWidgets.QLabel('Номер:', parent = label_box)
    label_birthdate     = QtWidgets.QLabel('Дата рождения:', parent = label_box)
    label_index         = QtWidgets.QLabel('Индекс:', parent = label_box)
    label_city          = QtWidgets.QLabel('Город:', parent = label_box)
    label_street        = QtWidgets.QLabel('Улица:', parent = label_box)
    label_house         = QtWidgets.QLabel('Дом:', parent = label_box)
    label_flat          = QtWidgets.QLabel('Квартира:', parent = label_box)
    label_email         = QtWidgets.QLabel('Email:', parent = label_box)
    label_pass          = QtWidgets.QLabel('Пароль:', parent = label_box)

    line_list = []
    G.line_list = line_list

    for count in range(1,14):
        line_list.append(QLineEdit(parent = G.mainwin))
    
    print(line_list)

    confirm_adding_button = QtWidgets.QPushButton('Добавить', button_box)
    confirm_adding_button.clicked.connect(adding_sql)
#---------------
    label_layout = QVBoxLayout(label_box)
##    label_layout.addWidget(label_id)
    label_layout.addWidget(label_surname)
    label_layout.addWidget(label_name)
    label_layout.addWidget(label_patronymic)
    label_layout.addWidget(label_series)
    label_layout.addWidget(label_number)
    label_layout.addWidget(label_birthdate)
    label_layout.addWidget(label_index)
    label_layout.addWidget(label_city)
    label_layout.addWidget(label_street)
    label_layout.addWidget(label_house)
    label_layout.addWidget(label_flat)
    label_layout.addWidget(label_email)
    label_layout.addWidget(label_pass)
    label_box.setLayout(label_layout)

    line_layout = QVBoxLayout(line_box)
    
    for line in range(len(line_list)):
        line_layout.addWidget(line_list[line])
    
    line_box.setLayout(line_layout)
#---------------
    input_layout = QHBoxLayout(input_box)
    input_layout.addWidget(label_box)
    input_layout.addWidget(line_box)
    input_box.setLayout(input_layout)

    button_layout = QHBoxLayout(button_box)
    button_layout.addWidget(confirm_adding_button)
    button_box.setLayout(button_layout)
#---------------
    main_adding_layout = QVBoxLayout(main_adding_win)
    main_adding_layout.addWidget(input_box)
    main_adding_layout.addWidget(button_box)
    main_adding_win.setLayout(main_adding_layout)

    main_adding_win.exec_()

    print('<<<adding_client')

#=================================================
def adding_sql():
    print('>>>adding_sql')

##    print( G.line_list[0].text() )

    def error_mess():
        info_message = QtWidgets.QMessageBox()
        info_message.setWindowTitle("Ошибка")
        info_message.setText("Присутствуют пустые или неверные значения!")
        info_message.setIcon(3)
        info_message.exec_()

    for check_line in G.line_list:       
        line_text = check_line.text()
        print(line_text, '- line_text')
        if line_text == '':
            error_mess()
            return
            
    sql_command = "insert into Client ( ClientSurname, ClientName, ClientPatronymic,ClientPassSeries,"+\
               "ClientPassNumber, ClientBirthDate, ClientAddressIndex, ClientCity, ClientStreet, ClientHouse, "+\
               "ClientFlat,ClientEmail,ClientPassword) values ("
    sql_command = sql_command + "'"+\
                              G.line_list[0].text() +"', '"+\
                              G.line_list[1].text() +"', '"+\
                              G.line_list[2].text() +"', "+\
                              G.line_list[3].text() +", "+\
                              G.line_list[4].text() +", '"+\
                              G.line_list[5].text() +"', "+\
                              G.line_list[6].text() +", '"+\
                              G.line_list[7].text() +"', '"+\
                              G.line_list[8].text() +"', "+\
                              G.line_list[9].text() +", "+\
                              G.line_list[10].text() +", '"+\
                              G.line_list[11].text() +"', '"+\
                              G.line_list[12].text() +"');"

    print(1)
    try:
        cursor = G.connection.cursor()
        cursor.execute(sql_command)
    except:
        error_mess()
        return
    print(2)
    G.main_adding_win.close()
    
    table_fill(G.tableUsers)
    print(sql_command)
                              
    print('<<<adding_sql')

