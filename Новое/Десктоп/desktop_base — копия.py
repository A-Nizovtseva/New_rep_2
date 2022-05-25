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

#========================================
class keyEvent_Change_users(QtWidgets.QLabel):

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
    G.type_sort = 'UserId'
    G.username = ''

    win1.setGeometry(50, 50, 900, 725)

    G.label_sort = QtWidgets.QLabel('Тип сортировки: ' + str(G.type_sort)+
                                    '\nИмя пользователя: '+str(G.username))#, parent = win1)    
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

#=================================================
def table_show(win1):

    mainLayout = QtWidgets.QVBoxLayout()
##    G.layout = mainLayout
##    mw0.vlay.addWidget( mw0.inf, alignment = QtCore.Qt.AlignTop )
    mainLayout.addWidget( G.label_sort, alignment = QtCore.Qt.AlignTop  )
    mainLayout.addWidget( G.win3, alignment = QtCore.Qt.AlignTop )    
##    mainLayout.addWidget( G.tableUsers )
    win1.setLayout( mainLayout )

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

    buttonLayout = QtWidgets.QHBoxLayout()
    
    buttonLayout.addWidget(esc_button)
    buttonLayout.addWidget(finding_button)
    buttonLayout.addWidget(sorting_button)


    win1.setLayout(buttonLayout)

    G.win3 = win1

    print('<<<button_draw')
#=================================================
def on_Esc():
    print('>>>on_Esc')
    editing_box = QtWidgets.QLabel( parent=G.mainwin )
    editing_box.setWindowFlags(QtCore.Qt.Window)
    editing_box.setGeometry(0, 0, 300, 300)
    
    label_sort = QtWidgets.QLabel('Тип сортировки: ' + str(G.type_sort)+
                                    '\nИмя пользователя: '+str(G.username), parent = editing_box)    
    label_sort.setStyleSheet(
        'border-color:black; border-width:1px;border-style:solid;' + \
        'background:white; color:black;' +\
        'font:15px;')
    label_sort.setAlignment( QtCore.Qt.AlignLeft )
    label_sort.setAlignment( QtCore.Qt.AlignVCenter )
    print(1)
    esc_button = QtWidgets.QPushButton('Выход (ESC)', editing_box)
    esc_button.setStyleSheet('font:18px;')
    esc_button.setGeometry( 0, 0, 100, 100 )
    esc_button.clicked.connect(on_Esc_2)
    print(2)
    h_layout = QVBoxLayout(editing_box)
    h_layout.addWidget(label_sort)
    h_layout.addWidget(esc_button)

    editing_box.setLayout(h_layout)

    editing_box.show()
    print('<<<on_Esc')

#=================================================
def on_Esc_2():
    print('>>>on_Esc')
    editing_box = QtWidgets.QWidget( parent=G.mainwin )
    editing_box.setWindowFlags(QtCore.Qt.Window)# |                        QtCore.Qt.FramelessWindowHint |                         QtCore.Qt.WindowTitleHint)
    editing_box.setGeometry(100, 100, 300, 300)
    
    label_sort = QtWidgets.QLabel('Тип сортировки: ' + str(G.type_sort)+
                                    '\nИмя пользователя: '+str(G.username), parent = editing_box)    
    label_sort.setStyleSheet(
        'border-color:black; border-width:1px;border-style:solid;' + \
        'background:white; color:black;' +\
        'font:15px;')
    label_sort.setAlignment( QtCore.Qt.AlignLeft )
    label_sort.setAlignment( QtCore.Qt.AlignVCenter )

    esc_button = QtWidgets.QPushButton('Выход (ESC)', editing_box)
    esc_button.setStyleSheet('font:18px;')
    esc_button.setGeometry( 0, 0, 100, 100 )
##    esc_button.clicked.connect(on_Esc)

    table_show_2()

    h_layout = QVBoxLayout(editing_box)
    h_layout.addWidget(label_sort)
    h_layout.addWidget(esc_button)
    h_layout.addWidget(G.tableUsers)    

    editing_box.setLayout(h_layout)

    editing_box.show()
    editing_box.setFocus()
    
    print('<<<on_Esc')

#=================================================
def table_show_2():

    print('>>>table_show')

    G.tableUsers = QtWidgets.QTableWidget( G.mainwin )

    G.tableUsers.setColumnCount(5)
    G.tableUsers.setColumnWidth( 0, 150 )
    G.tableUsers.setColumnWidth( 1, 300 )
    G.tableUsers.setColumnWidth( 2, 100 )
    G.tableUsers.setColumnWidth( 3, 200 )
    G.tableUsers.setColumnWidth( 4, 200 )

    G.tableUsers.setHorizontalHeaderLabels( ['Id пользователя', 'Имя пользователя', 'Фамилия', 'Отчество', 'Город'] )
    G.tableUsers.setGeometry( 0, 100, 900, 650 )

    G.tableUsers.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
    G.tableUsers.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows)
    G.tableUsers.setSelectionMode(QtWidgets.QAbstractItemView.SingleSelection)
    G.tableUsers.verticalHeader().hide()

    G.tableUsers.show()
    G.tableUsers.setFocus()

    G.tableUsers.horizontalHeader().setSectionResizeMode(1, QtWidgets.QHeaderView.Stretch)
    G.tableUsers.horizontalHeader().setSectionResizeMode(3, QtWidgets.QHeaderView.Stretch)
    G.tableUsers.horizontalHeader().setSectionResizeMode(4, QtWidgets.QHeaderView.Stretch)

    table_fill(G.tableUsers)

#=================================================
def table_fill(tb):
    print('>>>table_fill=====================')

##    rowId_0 = G.tableUsers.currentIndex().row()     #номер текущей строчки в таблице   
##
##    top_data = []
##    bottom_data = []
##    
##    if last_value_given == None:        
##        if rowId_0 == -1:
##            current_id = ''
##            last_value = ''
##        elif 1:
##            current_id = G.tableUsers.item(rowId_0,0).text()
##            last_value = str( G.tableUsers.item(rowId_0, int(G.index_sort)).text())
##        elif 0: pass
##    elif 1:
##        up_data_found = find_up( last_value_given )        
##        if up_data_found == []:
##            current_id = G.tableUsers.item(rowId_0,0).text()
##            last_value = str( G.tableUsers.item(rowId_0, int(G.index_sort)).text())
##        elif 1:
##            current_id = up_data_found [-1] [0]
##            last_value = up_data_found [-1] [int(G.index_sort) ]
##            print('current_id')
##        elif 0: pass        
##    elif 0: pass
##        
##    if rowId_0 == -1:
##        G.starting = True
##        print('G.starting = True')
##    elif 1:
##        top_data = find_up( last_value )
##    elif 0: pass
##
##    print('current_id = ', current_id)   
##    bottom_data = find_down( last_value )
##    full_data = top_data + bottom_data
##    print(full_data)

###    G.db_command = ''
##    up_comm = 'select * from Client;'# + G.db_command + ' limit ' + str(G.tb_row_half)
##    print(up_comm)
##    
##    full_data = []
##    query = QtSql.QSqlQuery()
##    query.exec(up_comm)
##    query.last()
##    while query.isValid():
##        a_data = [query.value('ClientCode'), query.value('ClientName'),
##                  query.value('ClientSurname'), query.value('ClientPatronimic'),
##                  query.value('ClientCity')]
##        full_data.append(a_data)
##        query.previous()
##        continue
##    print(full_data)

    material_type_list = []
    
    cursor = cnxn.cursor()
    cursor.execute("select * from Client;")
    rows = cursor.fetchall()
    print(rows)
    tb.setRowCount(0)
    print(1)
    
    for empty_row in range( len(rows) ):

        tb.insertRow(empty_row)
        
        cell = QtWidgets.QTableWidgetItem (str(rows[empty_row][0])) # Заполн. поле N 0
        tb.setItem (empty_row, 0 , cell)

        cell = QtWidgets.QTableWidgetItem (str(rows[empty_row][1])) # Заполн. поле N 1
        tb.setItem (empty_row, 1 , cell)

        cell = QtWidgets.QTableWidgetItem (str(rows[empty_row][2])) # Заполн. поле N 2
        tb.setItem (empty_row, 2 , cell)

        cell = QtWidgets.QTableWidgetItem (str(rows[empty_row][3])) # Заполн. поле N 3
        tb.setItem (empty_row, 3 , cell)

        cell = QtWidgets.QTableWidgetItem (str(rows[empty_row][8])) # Заполн. поле N 4
        tb.setItem (empty_row, 4 , cell)

        continue
    
    G.tableUsers.setFocus()

##    tb_rowCount = G.tableUsers.rowCount()
##
##    final_rowId = tb_rowCount//2
##
##    print('current_id =', current_id)
##    for rowId in range(tb_rowCount):
##        print('G.tableUsers.item(rowId,0).text() = ', G.tableUsers.item(rowId,0).text())
##        if G.tableUsers.item(rowId,0).text() == str(current_id):
##            final_rowId = rowId
##            break            
##        elif 0: pass
##        
##        continue
##
##    print(final_rowId, '- final_rowId')
##    
##    G.tableUsers.setCurrentCell( final_rowId,0 )
##
##    print('G.top_flag =', G.top_flag, ' |  G.bottom_flag =', G.bottom_flag)        
##    G.lock = 0
##    print('G.lock = 0')
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

if __name__ == "__main__":
    
    app = QtWidgets.QApplication(sys.argv)

    con1 = QtSql.QSqlDatabase.addDatabase ('QSQLITE')
    con1.setDatabaseName('forg0.db')
    con1.open()
    if con1.lastError().isValid():
        YNC( con1.lastError().text(), parent=None )
        con1.close()
    elif 0: pass

    window = keyEvent_Change_users( None )

    window.show()

    yyyy = app.exec_()

