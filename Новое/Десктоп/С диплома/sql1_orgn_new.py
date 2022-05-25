import os, configparser, sys, time
from PyQt5 import QtCore, QtGui, QtWidgets, QtSql

from UNI_LIB import *

class globaldata:
    pass

global G
G = globaldata()

print(__name__+' - users')

#========================================
class keyEvent_Change_orgn(QtWidgets.QLabel):

    def __init__(self, parent0):
        QtWidgets.QLabel.__init__(self, parent=parent0 )
        main( self )
        return
    
    def keyPressEvent(self, knopka):
        
        if knopka.type() == QtCore.QEvent.KeyPress:    

            if knopka.key() == 16777216: #Esc
                on_Esc(self)
            elif knopka.key() == 16777266: #F3
                finding() 
            elif knopka.key() == 16777267: #F4
                sorting()
            elif knopka.key() == 16777268: #F5
                editing('add')
            elif knopka.key() == 16777269: #F6
                editing('change')
            elif knopka.key() == 16777270: #F7
                deleting()
##            elif knopka.key() == 16777271: #F8
##                struktura('forg', con1)
##
            elif 0: pass
        elif 0: pass

   
#=================================================
def main(win1):

    print('>>>main')
    G.mainwin = win1
    G.tb_row_count = 20
    G.tb_row_half = G.tb_row_count//2
    G.type_sort = 'ORGN'
    G.index_sort = 0
    G.db_command = 'ORDER BY ' + str(G.type_sort) + ' ASC'
    G.lock = 0
    G.naio = ''
    G.type_sort_show = 'Id организации'
    G.top_flag = 1
    G.bottom_flag = 0
    
    win1.setGeometry(50, 50, 900, 725)

    G.label_sort = QtWidgets.QLabel('Тип сортировки: ' + str(G.type_sort_show)+
                                    '\nИмя пользователя: '+str(G.naio), parent = win1)    
    G.label_sort.setStyleSheet(
        'border-color:black; border-width:1px;border-style:solid;' + \
        'background:white; color:black;' +\
        'font:15px;')
    G.label_sort.setGeometry( 0, 50, 900, 50 )
    G.label_sort.setAlignment( QtCore.Qt.AlignLeft )
    G.label_sort.setAlignment( QtCore.Qt.AlignVCenter )

    button_draw(win1)

    table_show(win1)

    win1.show()
    print('<<<main')
    return

#========================================
def on_Esc( win1 ):    
    print('>>>on_Esc')
    
    if __name__ == "__main__":
        exit_msg = QtWidgets.QMessageBox(4, 'Выход', "Выйти из программы?")
        yes_btn = exit_msg.addButton('Да, выйти', 5)
        no_btn = exit_msg.addButton('Нет, продолжить работу', 5)
        exit_msg.setEscapeButton(no_btn)
        exit_msg.setStyleSheet("QPushButton{font: 25px; padding: 15px;}QLabel{font: 25px;}")     
        button_pressed = exit_msg.exec_()
        print(button_pressed, 'button_pressed')
        if button_pressed == 0:
            print('Выход')
            win1.close()
            print('<<<on_Esc')
            return
        elif 1:
            print('<<<on_Esc')
            return                      
        elif 0: pass
    elif 0: pass
    print('1')
    G.mainwin.close()
    print('<<<on_Esc')
    return

#=================================================
def table_show(win1):

    print('>>>table_show')

    G.tableFORG = QtWidgets.QTableWidget( win1 )

    G.tableFORG.setColumnCount(5)
    G.tableFORG.setColumnWidth( 0, 150 )
    G.tableFORG.setColumnWidth( 1, 300 )
    G.tableFORG.setColumnWidth( 2, 100 )
    G.tableFORG.setColumnWidth( 3, 200 )
    G.tableFORG.setColumnWidth( 4, 200 )

    G.tableFORG.setHorizontalHeaderLabels( ['Id организации', 'Наименование', 'Банк', 'Адрес', 'Телефон'] )
    G.tableFORG.setGeometry( 0, 100, 900, 650 )

    G.tableFORG.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
    G.tableFORG.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows)
    G.tableFORG.setSelectionMode(QtWidgets.QAbstractItemView.SingleSelection)
    G.tableFORG.verticalHeader().hide()

    G.tableFORG.show()
    G.tableFORG.setFocus()

    G.tableFORG.horizontalHeader().setSectionResizeMode(1, QtWidgets.QHeaderView.Stretch)
    G.tableFORG.horizontalHeader().setSectionResizeMode(3, QtWidgets.QHeaderView.Stretch)
    G.tableFORG.horizontalHeader().setSectionResizeMode(4, QtWidgets.QHeaderView.Stretch)

##    G.tableFORG.setSortingEnabled(True)

    mainLayout = QtWidgets.QVBoxLayout()
##    mw0.vlay.addWidget( mw0.inf, alignment = QtCore.Qt.AlignTop )
    mainLayout.addWidget( G.win3, alignment = QtCore.Qt.AlignTop )
    mainLayout.addWidget( G.label_sort, alignment = QtCore.Qt.AlignTop  )
    mainLayout.addWidget( G.tableFORG )
    win1.setLayout( mainLayout )
    

    table_fill(G.tableFORG)

    line_change()

    G.tableFORG.selectRow( G.tb_row_count//2 )

    G.tableFORG.itemSelectionChanged.connect( line_change )
    print('<<<table_show')
    return

#=================================================
def table_fill(tb, last_value_given = None):
    print('>>>table_fill=====================')

    G.lock = 1
    print('G.lock = 1')

    rowId_0 = G.tableFORG.currentIndex().row()     #номер текущей строчки в таблице   

    top_data = []
    bottom_data = []
    
    if last_value_given == None:        
        if rowId_0 == -1:
            current_id = ''
            last_value = ''
        elif 1:
            current_id = G.tableFORG.item(rowId_0,0).text()
            last_value = str( G.tableFORG.item(rowId_0, int(G.index_sort)).text())
        elif 0: pass
    elif 1:
        up_data_found = find_up( last_value_given )        
        if up_data_found == []:
            current_id = G.tableFORG.item(rowId_0,0).text()
            last_value = str( G.tableFORG.item(rowId_0, int(G.index_sort)).text())
        elif 1:
            current_id = up_data_found [-1] [0]
            last_value = up_data_found [-1] [int(G.index_sort) ]
            print('current_id')
        elif 0: pass        
    elif 0: pass
        
    if rowId_0 == -1:
        G.starting = True
        print('G.starting = True')
    elif 1:
        top_data = find_up( last_value )
    elif 0: pass

    print('current_id = ', current_id)
    
    bottom_data = find_down( last_value )

    full_data = top_data + bottom_data

    print(full_data)

    tb.setRowCount(0)
    
    for empty_row in range( len(full_data) ):

        tb.insertRow(empty_row)
        
        cell = QtWidgets.QTableWidgetItem (str(full_data[empty_row][0])) # Заполн. поле N 0
        tb.setItem (empty_row, 0 , cell)

        cell = QtWidgets.QTableWidgetItem (str(full_data[empty_row][1])) # Заполн. поле N 1
        tb.setItem (empty_row, 1 , cell)

        cell = QtWidgets.QTableWidgetItem (str(full_data[empty_row][2])) # Заполн. поле N 2
        tb.setItem (empty_row, 2 , cell)

        cell = QtWidgets.QTableWidgetItem (str(full_data[empty_row][3])) # Заполн. поле N 3
        tb.setItem (empty_row, 3 , cell)

        cell = QtWidgets.QTableWidgetItem (str(full_data[empty_row][4])) # Заполн. поле N 4
        tb.setItem (empty_row, 4 , cell)

        continue
    
    G.tableFORG.setFocus()

    tb_rowCount = G.tableFORG.rowCount()

    final_rowId = tb_rowCount//2

    print('current_id =', current_id)
    for rowId in range(tb_rowCount):
        print('G.tableFORG.item(rowId,0).text() = ', G.tableFORG.item(rowId,0).text())
        if G.tableFORG.item(rowId,0).text() == str(current_id):
            final_rowId = rowId
            break            
        elif 0: pass
        
        continue

    print(final_rowId, '- final_rowId')
    
    G.tableFORG.setCurrentCell( final_rowId,0 )

    print('G.top_flag =', G.top_flag, ' |  G.bottom_flag =', G.bottom_flag)        
    G.lock = 0
    print('G.lock = 0')
    print('<<<table_fill=====================')
    
#================================================= 
def line_change():
    print('>>>line_change>>>>>>>>>')

    if G.lock == 1:
        print('G.lock == 1')
        print('<<<line_change<<<<<<<<<')
        return
    
    rowId_0 = G.tableFORG.currentIndex().row()
    tb_rowCount = G.tableFORG.rowCount()

    if rowId_0 <= 0:
        if G.top_flag == 0:           
            table_fill(G.tableFORG)
        elif 0: pass        
    elif 0: pass

    if rowId_0 >= tb_rowCount-1:       
        if G.bottom_flag == 0:            
            table_fill(G.tableFORG)
        elif 0: pass       
    elif 0: pass
    
    G.tableFORG.show()
    rowId_0 = G.tableFORG.currentIndex().row()  
    G.naio = G.tableFORG.item(rowId_0, 1).text()
    text_top = 'Тип сортировки: ' + str(G.type_sort_show)+\
               '\nНаименование организации: '+str(G.naio)
    G.label_sort.setText(text_top)

    print('<<<line_change<<<<<<<<<')

#=================================================     
def find_up(last_value):
    print('>>>find_up')

    G.db_command = 'where ' + str(G.type_sort) + " <= '" + str(last_value)+\
          "' ORDER BY " + str(G.type_sort) + ' DESC '

    up_comm = 'select * from forg ' + G.db_command + ' limit ' + str(G.tb_row_half)
    print(up_comm)
    
    UP_data = []
    query = QtSql.QSqlQuery()
    query.exec(up_comm)
    query.last()
    while query.isValid():
        a_data = [query.value('ORGN'), query.value('NAIO'),
                  query.value('GOSB'), query.value('ADRS'),
                  query.value('TELF')]
        UP_data.append(a_data)
        query.previous()
        continue
    print(UP_data)

    if len(UP_data) < G.tb_row_half:
        G.top_flag = 1
        print('G.top_flag = 1')
    elif 1:
        G.top_flag = 0
        print('G.top_flag = 0')
    elif 0: pass
        
    print('<<<find_up\n')    
    return UP_data

#=================================================
def find_down(last_value):
    print('>>>find_down')

    if G.starting == True:
        G.db_command = ''
        down_comm = 'select * from forg ' + G.db_command + ' limit ' + str(G.tb_row_count)
        G.starting = False
        print('G.starting = False')
    elif 1:
        G.db_command = 'where ' + str(G.type_sort) + " > '" + str(last_value)+\
                  "' ORDER BY " + str(G.type_sort) + ' '
        down_comm = 'select * from forg ' + G.db_command + ' limit ' + str(G.tb_row_half)
    elif 0: pass

    print(down_comm)
    
    DOWN_data = []  
    query = QtSql.QSqlQuery()    
    query.exec(down_comm)
    query.first()
    while query.isValid():
        a_data = [query.value('ORGN'), query.value('NAIO'),
                  query.value('GOSB'), query.value('ADRS'),
                  query.value('TELF')]
        DOWN_data.append(a_data)
        query.next()
        continue       
    print(DOWN_data)

    if len(DOWN_data) < G.tb_row_half:
        G.bottom_flag = 1
        print('G.bottom_flag = 1')
    elif 1:
        G.bottom_flag = 0
        print('G.bottom_flag = 0')
    elif 0: pass

    
    print('<<<find_down\n')
    return(DOWN_data)

#=================================================
def sorting_change(button_pressed):
    print('>>>sorting_change')

    print(button_pressed)

    if button_pressed == 5:
        return
    elif button_pressed == 0:
        G.index_sort = 0
        G.type_sort = "ORGN"
        G.type_sort_show = "ORGN"
    elif button_pressed == 1:
        G.index_sort = 1
        G.type_sort = "NAIO"
        G.type_sort_show = "Наименование"
    elif button_pressed == 2:
        G.index_sort = 2
        G.type_sort = "GOSB"
        G.type_sort_show = "Банк"
    elif button_pressed == 3:
        G.index_sort = 3
        G.type_sort = "ADRS"
        G.type_sort_show = "Адрес"
    elif button_pressed == 4:
        G.index_sort = 4
        G.type_sort = "TELF"
        G.type_sort_show = "Телефон"
    elif 0: pass

    print('G.type_sort =', G.type_sort)

    print('<<<sorting_change')

#=================================================
def sorting():
    print('>>>sorting')

    sorting_box = QtWidgets.QMessageBox(4,'Выбор сортировки', "Выберите тип сортировки:")
    
    id_btn_0 = sorting_box.addButton("ORGN", 5)
    name_btn_1 = sorting_box.addButton("Наименование", 5)
    bank_btn_2 = sorting_box.addButton("Банк", 5)
    address_btn_3 = sorting_box.addButton("Адрес", 5)
    phone_btn_4 = sorting_box.addButton("Телефон", 5)
    cancel_btn_5 = sorting_box.addButton("Отмена", 5)

    sorting_box.setEscapeButton(cancel_btn_5)
    sorting_box.setStyleSheet("QPushButton{font: 25px; padding: 15px;}QLabel{font: 25px;}")

    button_pressed = sorting_box.exec_()

    sorting_change(button_pressed)

    table_fill(G.tableFORG)

    print('<<<sorting')

#========================================
def finding():
    print('>>>finding')
    finding_box = QtWidgets.QMessageBox(4,'Поиск', "Выберите поле для поиска:")

    id_btn_0 = finding_box.addButton("ORGN", 5)
    name_btn_1 = finding_box.addButton("Наименование", 5)
    bank_btn_2 = finding_box.addButton("Банк", 5)
    address_btn_3 = finding_box.addButton("Адрес", 5)
    phone_btn_4 = finding_box.addButton("Телефон", 5)
    cancel_btn_5 = finding_box.addButton("Отмена", 5)

    finding_box.setEscapeButton(cancel_btn_5)
    finding_box.setStyleSheet("QPushButton{font: 25px; padding: 15px;}QLabel{font: 25px;}")

    button_pressed = finding_box.exec_()

    if button_pressed == 5:
        print('<<<finding')
        return
        
    sorting_change(button_pressed)
    
    input_result = finding_input()
    
    table_fill(G.tableFORG, input_result)
    
    print('<<<finding')
    return

#========================================
def finding_input():
    print('>>>finding_input')
    finding_input_box = QtWidgets.QDialog ( parent=G.mainwin )
    finding_input_box = finding_input_box

    def finding_button_clicked():
        print('>>>finding_button_clicked')
        
        finding_input_box.close()

        print('<<<finding_button_clicked')
        return

    window_width = 600
    window_hight = 175

    screen = app.primaryScreen()
    pos_width = (screen.size().width()-window_width)//2
    pos_height = (screen.size().height()-window_hight)//2    
    finding_input_box.setGeometry(pos_width, pos_height, window_width, window_hight)

    label_finding = QtWidgets.QLabel('Введите:', parent=finding_input_box)
    label_finding.setStyleSheet('color:black;font:25px;font-weight:bold;')   
    label_finding.setGeometry( 0, 25, 150, 50)
    label_finding.setAlignment( QtCore.Qt.AlignCenter )

    text_finding = QtWidgets.QLineEdit(parent=finding_input_box)
    text_finding.setStyleSheet('font:22px;')
    text_finding.setGeometry( 150, 25, window_width-160, 50 )

    enter_button = QtWidgets.QPushButton('Найти', finding_input_box)
    enter_button.setStyleSheet('font:20px;')
    enter_button.setGeometry( 150, 100, 200, 50 )
    enter_button.clicked.connect(finding_button_clicked)
    
    finding_input_box.exec_()

    input_result = text_finding.text()
    print(input_result, " - input_result")
    print('<<<finding_input')
    return input_result

#========================================
def exit_box():
    print('>>>exit_box')

    exit_msg = QtWidgets.QMessageBox(4, 'Выход', "Сохранить данные?")
    yes_btn = exit_msg.addButton('Да, сохранить', 5)
    no_btn = exit_msg.addButton('Нет, выйти без сохранения', 5)
    cancel_btn = exit_msg.addButton('Отмена', 5)
    exit_msg.setEscapeButton(cancel_btn)
    exit_msg.setStyleSheet("QPushButton{font: 25px; padding: 15px;}QLabel{font: 25px;}")     
    button_pressed = exit_msg.exec_()

    print (button_pressed)
    
    if button_pressed <= 1:

        G.exit_result = button_pressed
        G.editing_box.close()        

    elif 0: pass

    print('<<<exit_box')
    return 
    
#========================================
def sql_exe(given_command):

    print('>>>sql_exe', given_command)

    query = QtSql.QSqlQuery()    
    exec_result = query.exec(given_command)
    print(exec_result)
    
    print('<<<sql_exe', given_command)

    return exec_result

#========================================
def editing(edit_type):
    print('>>>editing', edit_type)

    G.exit_result = 1

    editing_box = QtWidgets.QDialog ( parent=G.mainwin )
    G.editing_box = editing_box

    window_width = 800
    window_hight = 500

    screen = app.primaryScreen()
    pos_width = (screen.size().width()-window_width)//2
    pos_height = (screen.size().height()-window_hight)//2    
    editing_box.setGeometry(pos_width, pos_height, window_width, window_hight)

#naio
    label_name = QtWidgets.QLabel('Наименование:', parent = editing_box)
    label_name.setStyleSheet('color:black;font:25px;font-weight:bold;')   
    label_name.setGeometry( 0, 25, 250, 50)
    label_name.setAlignment( QtCore.Qt.AlignCenter )

    text_name = QtWidgets.QLineEdit(parent=editing_box)
    text_name.setStyleSheet('font:22px;')
    text_name.setGeometry( 250, 25, window_width-250, 50 )
#Bank
    label_bank = QtWidgets.QLabel('Введите банк:', parent = editing_box)
    label_bank.setStyleSheet('font:25px;font-weight:bold;')
    label_bank.setGeometry( 0, 125, 250, 50 )
    label_bank.setAlignment( QtCore.Qt.AlignCenter )

    text_bank = QtWidgets.QLineEdit(parent=editing_box)
    text_bank.setStyleSheet('font:22px;')
    text_bank.setGeometry( 250, 125, window_width-250, 50 )
#Address
    label_address = QtWidgets.QLabel('Введите адрес:', parent = editing_box)
    label_address.setStyleSheet('color:black;font:25px;font-weight:bold;')   
    label_address.setGeometry( 0, 225, 250, 50)
    label_address.setAlignment( QtCore.Qt.AlignCenter )

    text_address = QtWidgets.QLineEdit(parent=editing_box)
    text_address.setStyleSheet('font:22px;')
    text_address.setGeometry( 250, 225, window_width-250, 50 )
#Phone
    label_phone = QtWidgets.QLabel('Введите телефон:', parent = editing_box)
    label_phone.setStyleSheet('color:black;font:25px;font-weight:bold;')   
    label_phone.setGeometry( 0, 325, 250, 50)
    label_phone.setAlignment( QtCore.Qt.AlignCenter )

    text_phone = QtWidgets.QLineEdit(parent=editing_box)
    text_phone.setStyleSheet('font:22px;')
    text_phone.setGeometry( 250, 325, window_width-250, 50 )
#Кнопка "Добавить"

    enter_button = QtWidgets.QPushButton('Добавить', editing_box)
    enter_button.setStyleSheet('font:20px;')
    enter_button.setGeometry( 250, 400, 200, 50 )
    enter_button.setCheckable(True)
    enter_button.clicked.connect(exit_box)

    if edit_type == 'change':

        current_row = G.tableFORG.currentIndex().row()

        current_id = G.tableFORG.item(current_row, 0).text()       
        current_name = G.tableFORG.item(current_row, 1).text()
        current_bank = G.tableFORG.item(current_row, 2).text()
        current_address = G.tableFORG.item(current_row, 3).text()
        current_phone = G.tableFORG.item(current_row, 4).text()

        text_name.setText(current_name)
        text_bank.setText(current_bank)
        text_address.setText(current_address)
        text_phone.setText(current_phone)

    elif 0: pass

    editing_box.exec_()

    print('G.exit_result = ', G.exit_result)

    if G.exit_result == 0:              #Сохранить
    
        name = text_name.text()
        bank = text_bank.text()
        address = text_address.text()
        phone = text_phone.text()

        if edit_type == 'add':
            
            command_exe = 'insert into forg (NAIO, GOSB, ADRS, TELF) values ' +\
                      "('" + str(name) + "', " + str(bank) + ", '" + str(address) + "', '" + str(phone) + "')"
            
        elif edit_type == 'change':

            command_exe = "update forg set NAIO = '"+str(name)+"', GOSB = '"+bank+\
                        "', ADRS = '"+address+"', TELF = '"+phone+"' where ORGN = "+current_id
            
        elif 0: pass
        
        print(command_exe)

        result_check = sql_exe(command_exe)

        if result_check == False:
            info_message = QtWidgets.QMessageBox()
            info_message.setWindowTitle("Ошибка")
            info_message.setText("Ошибка ввода данных")
            info_message.setIcon(3)
            info_message.exec_()
        elif 1:
            
            G.index_sort = 1
            G.type_sort = "NAIO"

            table_fill(G.tableFORG, name)
    
    elif 0: pass

    print('<<<editing')

#========================================
def deleting():
    print('>>>deleting')

    rowId_0 = G.tableFORG.currentIndex().row()  
    currentId = G.tableFORG.item(rowId_0, 0).text()
    currentName = G.tableFORG.item(rowId_0, 1).text()
    currentAddress = G.tableFORG.item(rowId_0, 3).text()
    

    exit_msg = QtWidgets.QMessageBox(4, 'Удаление', "Удалить текущую запись? \n (Наименование: "+\
                                     currentName + ", Адрес: " + currentAddress + ")")
    yes_btn = exit_msg.addButton('Да, удалить', 5)
    cancel_btn = exit_msg.addButton('Отмена', 5)
    exit_msg.setEscapeButton(cancel_btn)
    exit_msg.setStyleSheet("QPushButton{font: 25px; padding: 15px;}QLabel{font: 25px;}")     
    button_pressed = exit_msg.exec_()

    print (button_pressed)
    
    if button_pressed == 1:
        print('<<<deleting')
        return       

    sql_command = "delete from forg where ORGN = " + currentId
    
    sql_exe(sql_command)
    
    table_fill(G.tableFORG)
       
    print('<<<deleting')

#========================================
def button_draw(win2):
    print('>>>button_draw')

    win1 = QtWidgets.QLabel('\n\n\n',parent = win2)

    button_width = 150
    button_height = 50

#ESC
    esc_button = QtWidgets.QPushButton('Выход (ESC)', win1)
    esc_button.setStyleSheet('font:18px;')
    esc_button.setGeometry( 0, 0, button_width, button_height )
    esc_button.clicked.connect(on_Esc)
#F3(поиск)
    finding_button = QtWidgets.QPushButton('Поиск (F3)', win1)
    finding_button.setStyleSheet('font:18px;')
    finding_button.setGeometry( 150, 0, button_width, button_height )
    finding_button.clicked.connect(finding)
#F4(сортировка)
    sorting_button = QtWidgets.QPushButton('Сортировка (F4)', win1)
    sorting_button.setStyleSheet('font:18px;')
    sorting_button.setGeometry( 300, 0, button_width, button_height )
    sorting_button.clicked.connect(sorting)
#F5(добавить)
    adding_button = QtWidgets.QPushButton('Добавить (F5)', win1)
    adding_button.setStyleSheet('font:18px;')
    adding_button.setGeometry( 450, 0, button_width, button_height )
    adding_button.clicked.connect(lambda:editing('add'))
#F6(изменить)
    editing_button = QtWidgets.QPushButton('Изменить (F6)', win1)
    editing_button.setStyleSheet('font:18px;')
    editing_button.setGeometry( 600, 0, button_width, button_height )
    editing_button.clicked.connect(lambda:editing('change'))
#F7(удалить)
    deleting_button = QtWidgets.QPushButton('Удалить (F7)', win1)
    deleting_button.setStyleSheet('font:18px;')
    deleting_button.setGeometry( 750, 0, button_width, button_height )
    deleting_button.clicked.connect(deleting)

    buttonLayout = QtWidgets.QHBoxLayout()
    
    buttonLayout.addWidget(esc_button)
    buttonLayout.addWidget(finding_button)
    buttonLayout.addWidget(sorting_button)
    buttonLayout.addWidget(adding_button)
    buttonLayout.addWidget(editing_button)
    buttonLayout.addWidget(deleting_button)

    win1.setLayout(buttonLayout)

    G.win3 = win1

    print('<<<button_draw')
  
#=================================================


if __name__ == "__main__":
    
    app = QtWidgets.QApplication(sys.argv)

    con1 = QtSql.QSqlDatabase.addDatabase ('QSQLITE')
    con1.setDatabaseName('forg0.db')
    con1.open()
    if con1.lastError().isValid():
        YNC( con1.lastError().text(), parent=None )
        con1.close()
    elif 0: pass

    window = keyEvent_Change_orgn( None )

    window.show()

    yyyy = app.exec_()
