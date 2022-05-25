import os, configparser, sys, time, pyodbc
from PyQt5 import QtCore, QtGui, QtWidgets, QtSql, Qt
from PyQt5.QtWidgets import (QWidget, QPushButton, QLabel, QTableWidget, QAbstractItemView,
QLineEdit, QComboBox, QApplication, QHeaderView, QTableWidgetItem, QHBoxLayout, 
QVBoxLayout, QCheckBox, QDialog)
from PyQt5.QtGui import QPixmap

cnxn = pyodbc.connect(driver='{ODBC Driver 17 for SQL Server}',
                      server='HARZA-N\SQLEXPRESS', 
                      database='bd_dem',               
                      trusted_connection='yes')

class globaldata:
    pass

global G
G = globaldata()
   
#=================================================
def main(win1):

    print('>>>main')
    G.mainwin = win1
    G.type_sort = 'UserId'
    G.username = ''
    G.sort_type = ''
    G.text_to_find = ''

    top_label = QtWidgets.QWidget(parent = G.mainwin)
    
    win1.setGeometry(50, 50, 900, 725)

    pixmap_widget = QWidget(parent = top_label)
    pixmap = QPixmap("D:\Прочее\Учеба\дэ\Новое\Импорт переделанный\Сотрудники_import\Игнатов.jpeg")    
    pix_label = QLabel(parent = pixmap_widget)
    pix_label.setPixmap(pixmap)

    label_name = QtWidgets.QLabel('Имя: ' + str(G.type_sort)+
                                  '\nФамилия: '+str(G.username)+
                                  '\nДолжность: '+str(G.username), parent = top_label)    
##    label_name.setStyleSheet(
##        'border-color:black; border-width:1px;border-style:solid;' + \
##        'background:white; color:black;' +\
##        'font:15px;')
    label_name.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;' )
##    label_name.setGeometry( 0, 50, 900, 50 )
    label_name.setAlignment( QtCore.Qt.AlignLeft )
    label_name.setAlignment( QtCore.Qt.AlignVCenter )

    esc_button = QtWidgets.QPushButton('Выход (ESC)', win1)
    esc_button.setStyleSheet('font:18px;')
    esc_button.setGeometry( 0, 0, 100, 50 )
##    esc_button.clicked.connect(on_Esc)

    top_layout = QtWidgets.QHBoxLayout()
    top_layout.addWidget( pix_label, alignment = QtCore.Qt.AlignTop  )
    top_layout.addWidget( label_name, alignment = QtCore.Qt.AlignTop  )
    top_layout.addWidget( esc_button, alignment = QtCore.Qt.AlignTop  )    
    top_label.setLayout( top_layout )
    
    G.top_label = top_label
    
    button_draw(win1)

    main_layout_form(win1)
    
    win1.show()
    print('<<<main')
    return

#=================================================
def main_layout_form(win):

    mainLayout = QtWidgets.QVBoxLayout()
##    G.layout = mainLayout
##    mw0.vlay.addWidget( mw0.inf, alignment = QtCore.Qt.AlignTop )
    mainLayout.addWidget( G.top_label, alignment = QtCore.Qt.AlignTop  )
    mainLayout.addWidget( G.win3, alignment = QtCore.Qt.AlignTop )
    
    win.setLayout( mainLayout )

#========================================
def button_draw(win2):
    print('>>>button_draw')

    win1 = QtWidgets.QWidget(parent = win2)

    button_width = 150
    button_height = 50

#ESC
    order_button = QtWidgets.QPushButton('Сформировать заказ', win1)
    order_button.setStyleSheet('font:18px;')
    order_button.setGeometry( 0, 0, button_width, button_height )
    order_button.clicked.connect(order_form)
#F3(поиск)
    finding_button = QtWidgets.QPushButton('Поиск (F3)', win1)
    finding_button.setStyleSheet('font:18px;')
    finding_button.setGeometry( 150, 0, button_width, button_height )
##    finding_button.clicked.connect(finding)
#F4(сортировка)
    sorting_button = QtWidgets.QPushButton('Сортировка (F4)', win1)
    sorting_button.setStyleSheet('font:18px;')
    sorting_button.setGeometry( 300, 0, button_width, button_height )
##    sorting_button.clicked.connect(sorting)

    buttonLayout = QtWidgets.QHBoxLayout()
    
    buttonLayout.addWidget(order_button)
    buttonLayout.addWidget(finding_button)
    buttonLayout.addWidget(sorting_button)


    win1.setLayout(buttonLayout)

    G.win3 = win1

    print('<<<button_draw')
    
#=================================================
def pressing():
    print('pressing')
#=================================================
def order_form():
    print('>>>order_form')
    
    order_win = QtWidgets.QWidget( parent=G.mainwin )
    order_win.setWindowFlags(QtCore.Qt.Window)
    order_win.setGeometry(0, 0, 500, 500)

    order_box = QtWidgets.QWidget( parent=G.mainwin )
    client_box = QtWidgets.QWidget( parent=G.mainwin )
    service_box = QtWidgets.QWidget( parent=G.mainwin )
#Ввод кода для штрих-кода------
    order_label = QtWidgets.QLabel('Введите номер заказа: ', parent = order_box)    
    order_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    order_label.setFixedHeight(30)

    order_line = QLineEdit(parent = order_box)
    order_line.setFixedHeight(30)
    order_line.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    order_line.setText ('ЦИФРЫ')

    barcode_button = QtWidgets.QPushButton('Сформировать штрих-код', order_box)
    barcode_button.setStyleSheet('font:18px;')
    barcode_button.clicked.connect(pressing)

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


#Выбор услуги-----------
    order_main_layout = QVBoxLayout(order_win)
    order_main_layout.addWidget(order_box)
    order_main_layout.addWidget(client_box)
    order_main_layout.addWidget(service_box)
    order_win.setLayout(order_main_layout)
    order_win.show()
    
    print('<<<order_form')

#=================================================
def table_show():

    print('>>>table_show')

    sender = G.mainwin.sender()
    G.sender = sender
    sender_text = sender.text()
    print(sender_text, '- sender_text')

    header_list = []

    if sender_text == "Выбрать":
        header_list = ['Id пользователя', 'Фамилия', 'Имя', 'Отчество', 'Серия', 'Номер',
                       'Дата рождения','Индекс','Город','Улица','Дом','Квартира','Логин','Пароль']
        G.column_count = 14
    else:
        header_list = ['Id услуги', 'Название', 'Код', 'Стоимость']
        G.column_count = 4
    print(header_list)
    print(G.column_count)
    
    table_win = QtWidgets.QWidget( parent=G.mainwin )
    table_win.setWindowFlags(QtCore.Qt.Window)
    G.table_win = table_win
    
#Верхний уровень - Поиск, Сортировка
    top_box = QtWidgets.QWidget( parent=G.mainwin )

    find_label = QtWidgets.QLabel('Поиск:', parent = top_box)    
    find_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    find_label.setFixedHeight(30)
    find_label.setFixedWidth(50)

    find_line = QLineEdit(parent = G.mainwin)
    find_line.setFixedHeight(30)
    find_line.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    find_line.textChanged[str].connect(on_finding_activated)

    sort_label = QtWidgets.QLabel('Сортировка:', parent = top_box)    
    sort_label.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    sort_label.setFixedHeight(30)
    sort_label.setFixedWidth(100)
    print(0)

    sorting_box = QComboBox(parent=G.mainwin)
    sorting_box.setFixedHeight(30)
    sorting_box.setStyleSheet( 'font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    sorting_box.addItems(header_list)
    sorting_box.activated[str].connect(on_sorting_activated)

    top_table_layout = QHBoxLayout(top_box)
    top_table_layout.addWidget(find_label)
    top_table_layout.addWidget(find_line)
    top_table_layout.addWidget(sort_label)
    top_table_layout.addWidget(sorting_box)
    top_box.setLayout(top_table_layout)
    print(0.1)
    
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
    print(1)  

    for i in range(G.column_count):
        G.tableUsers.horizontalHeader().setSectionResizeMode(i, QtWidgets.QHeaderView.Stretch)

    table_fill(G.tableUsers)

#Нижний уровень - Кнопка
    bottom_box = QtWidgets.QWidget( parent=G.mainwin )

    confirm_button = QtWidgets.QPushButton('Подтвердить', bottom_box)
    confirm_button.setFixedHeight(30)
    confirm_button.setStyleSheet('font:18px;')
    confirm_button.clicked.connect(on_adding_activated)

    add_client_button = QtWidgets.QPushButton('Добавить клиента', bottom_box)
    add_client_button.setFixedHeight(30)
    add_client_button.setStyleSheet('font:18px;')
    add_client_button.clicked.connect(adding_client)
   
    bottom_table_layout = QHBoxLayout(bottom_box)
    bottom_table_layout.addWidget(confirm_button)
    bottom_table_layout.addWidget(add_client_button)
    bottom_box.setLayout(bottom_table_layout) 

#Сборка полностью в один Layout
    table_layout = QVBoxLayout(table_win)
    table_layout.addWidget(top_box)
    table_layout.addWidget(G.tableUsers)
    table_layout.addWidget(bottom_box)
    table_win.setLayout(table_layout)
    table_win.show()

#=================================================
def adding_client():
    print('>>>adding_client')

    main_adding_win = QtWidgets.QWidget( parent=G.mainwin )
    main_adding_win.setWindowFlags(QtCore.Qt.Window)
    main_adding_win.setStyleSheet('font:13px;font-family: Comic Sans MS;background:#FFFFFF;')
    print(1)

    input_box = QtWidgets.QWidget( parent=G.mainwin )    
    label_box = QtWidgets.QWidget( parent=G.mainwin )
    line_box = QtWidgets.QWidget( parent=G.mainwin )    
    button_box = QtWidgets.QWidget( parent=G.mainwin )
#---------------
##    r = [None]*14
    
    label_id            = QtWidgets.QLabel('Id пользователя:', parent = label_box)    
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
    label_email         = QtWidgets.QLabel('Логин:', parent = label_box)
    label_pass          = QtWidgets.QLabel('Пароль:', parent = label_box)    

    line_id         = QLineEdit(parent = G.mainwin)
    line_surname    = QLineEdit(parent = G.mainwin)
    line_name       = QLineEdit(parent = G.mainwin)
    line_patronymic = QLineEdit(parent = G.mainwin)
    line_series     = QLineEdit(parent = G.mainwin)
    line_number     = QLineEdit(parent = G.mainwin)
    line_birthdate  = QLineEdit(parent = G.mainwin)
    line_index      = QLineEdit(parent = G.mainwin)
    line_city       = QLineEdit(parent = G.mainwin)
    line_street     = QLineEdit(parent = G.mainwin)
    line_house      = QLineEdit(parent = G.mainwin)
    line_flat       = QLineEdit(parent = G.mainwin)
    line_email      = QLineEdit(parent = G.mainwin)
    line_pass       = QLineEdit(parent = G.mainwin)

    confirm_adding_button = QtWidgets.QPushButton('Добавить', button_box)
#---------------
    label_layout = QVBoxLayout(label_box)
    label_layout.addWidget(label_id)
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
    line_layout.addWidget(line_id)
    line_layout.addWidget(line_surname)
    line_layout.addWidget(line_name)
    line_layout.addWidget(line_patronymic)
    line_layout.addWidget(line_series)
    line_layout.addWidget(line_number)
    line_layout.addWidget(line_birthdate)
    line_layout.addWidget(line_index)
    line_layout.addWidget(line_city)
    line_layout.addWidget(line_street)
    line_layout.addWidget(line_house)
    line_layout.addWidget(line_flat)
    line_layout.addWidget(line_email)
    line_layout.addWidget(line_pass)
    
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

    main_adding_win.show()

    print('<<<adding_client')
    
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
                           'Стоимость':'ServiceCost'}

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
def on_finding_activated(text):
    print('>>>onFindingActivated')

    G.text_to_find = text

    sql_exe = " where charindex('" +G.text_to_find+ "', " +G.sort_type+ ") > 0"+\
                  " order by " +G.sort_type+ ";"

    table_fill(G.tableUsers, sql_exe)

    print('<<<onFindingActivated')

#=================================================
def on_adding_activated():

    print('>>>on_adding_activated')
    
    row_id = G.tableUsers.currentIndex().row()  
    table_id = G.tableUsers.item(row_id, 0).text()
    
    if G.sender.text() == "Выбрать":
        G.client_choice_label.setText(str(table_id))
    elif G.sender.text() == "":
        old_text = G.service_choice_label.text()
        new_text = old_text + str(table_id) + '\n'
        G.service_choice_label.setText(new_text)
        
    G.table_win.close()

    print('<<<on_adding_activated')
#=================================================
def table_fill(tb, sql_exe = ';'):
    print('>>>table_fill=====================')
    print(G.column_count, '- column_count')

    material_type_list = []

    if G.column_count == 4:
        sql_exe = "select * from Service" + sql_exe
        if G.sort_type == '':            
            sql_exe = "select * from Service order by ServiceId;"
            G.sort_type = 'ServiceId'
        
    elif G.column_count == 14:
        sql_exe = "select * from Client" + sql_exe
        if G.sort_type == '':
            sql_exe = "select * from Client order by ClientCode;"
            G.sort_type = 'ClientCode'
        
    print(G.sort_type)
    print(sql_exe)

    print(0)    
    cursor = cnxn.cursor()
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
def finding():
    print('>>>finding')
    finding_box = QtWidgets.QDialog( parent=G.mainwin )
    finding_box.setGeometry(0, 0, 300, 300)
    
    label_sort = QtWidgets.QLabel('Тип сортировки: ' + str(G.type_sort)+
                                    '\nИмя пользователя: '+str(G.username), parent = finding_box)    
    label_sort.setStyleSheet(
        'border-color:black; border-width:1px;border-style:solid;' + \
        'background:white; color:black;' +\
        'font:15px;')
    label_sort.setAlignment( QtCore.Qt.AlignLeft )
    label_sort.setAlignment( QtCore.Qt.AlignVCenter )

    h_layout = QHBoxLayout(finding_box)
    h_layout.addWidget(label_sort)

    finding_box.setLayout(h_layout)

    finding_box.exec_()
    print('<<<finding')

#=================================================
def sorting():
    print('>>>sorting')
    sorting_box = QtWidgets.QDialog ( parent=G.mainwin )
    sorting_box.setGeometry(0, 0, 300, 300)
    
    label_sort = QtWidgets.QLabel('Тип сортировки: ' + str(G.type_sort)+
                                    '\nИмя пользователя: '+str(G.username), parent = sorting_box)    
    label_sort.setStyleSheet(
        'border-color:black; border-width:1px;border-style:solid;' + \
        'background:white; color:black;' +\
        'font:15px;')
    label_sort.setAlignment( QtCore.Qt.AlignLeft )
    label_sort.setAlignment( QtCore.Qt.AlignVCenter )

    sorting_box.exec_()
    print('<<<sorting')

  
#=================================================

core_app = QtWidgets.QApplication(sys.argv)

main_window = QtWidgets.QLabel()
##main_window.setStyleSheet('background:#FFFFFF;')
main(main_window)

sys.exit(core_app.exec_())

