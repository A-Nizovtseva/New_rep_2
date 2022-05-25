import os, configparser, sys, time, pyodbc
from PyQt5 import QtCore, QtGui, QtWidgets, QtSql, Qt
from PyQt5.QtWidgets import (QWidget, QPushButton, QLabel, QTableWidget, QAbstractItemView,
QLineEdit, QComboBox, QApplication, QHeaderView, QTableWidgetItem, QHBoxLayout, 
QVBoxLayout, QCheckBox)
from PyQt5.QtGui import QPixmap

cnxn = pyodbc.connect(driver='{ODBC Driver 17 for SQL Server}',
                      server='HARZA-N\SQLEXPRESS', 
                      database='bd_dem',               
                      trusted_connection='yes')
cursor = cnxn.cursor()
cursor.execute("select ClientName from Client group by ClientName;")
##row = cursor.fetchone()
rows = cursor.fetchall()
##empty = cursor.fetchall()

material_type_list = []
for i in range(len(rows)):
    x = rows[i][0]
    print( x )
    material_type_list.append(x)
    continue
print(material_type_list) 

global G

class Global_data(): pass

G = Global_data()
    
G.where = 'Все типы'

window_size_x = 1000
window_size_y = 950

#==========================================================================
def main(main_window):

    main_window.setGeometry(20, 40, window_size_x, window_size_y)
    
    central_widget = QWidget(main_window)
    main_window.setCentralWidget(central_widget)

    v_layout = QVBoxLayout()
    central_widget.setLayout(v_layout)

    top_widget = create_top_widget()
##    b_1 = QPushButton(text = '1')

    table_widget = create_table()
##    b_2 = QPushButton(text = '2')

    bottom_widget = create_bottom_widget()
##    b_3 = QPushButton(text = '3')
    
    v_layout.addWidget(top_widget, alignment = QtCore.Qt.AlignTop)
    v_layout.addWidget(table_widget) #, alignment = QtCore.Qt.AlignCenter)
    v_layout.addWidget(bottom_widget, alignment = QtCore.Qt.AlignBottom)
    
    main_window.show()
    
    return
#==========================================================================
def combo_show(main_window):


    
#Предыдущая страница
    previous_page_button = QPushButton(parent = main_window, text = '<')
##    previous_page_button.setGeometry(window_size_x - 100, window_size_y-50, 20, 20)

#Следующая страница
    next_page_button = QPushButton(parent = main_window, text = '>')
##    next_page_button.setGeometry(window_size_x - 50, window_size_y-50, 20, 20)

##    instead_table = QLineEdit(parent = main_window)
##    instead_table.setFixedHeight(300)
##

##
##    h_layout_1 = QHBoxLayout(main_window)
##    h_layout_1.addWidget(previous_page_button)
##    
##    h_layout_2 = QHBoxLayout(main_window)
##    h_layout_2.addWidget(next_page_button)
##
##    v_layout.insertWidget(0, input_line)
##    v_layout.insertWidget(1, sorting_box)
##    v_layout.insertWidget(-1, filter_box)

    create_top_widget(main_window)
    
##    v_layout = QVBoxLayout(main_window)
##    v_layout.addLayout(h_layout)
##    v_layout.addLayout(h_layout_1)
##    v_layout.addLayout(h_layout_2)
##    v_layout.addWidget(previous_page_button)
##    v_layout.addWidget(next_page_button)
##    v_layout.insertLayout(1, h_layout_1)
##    v_layout.insertLayout(-1, h_layout_2)
##    v_layout.addWidget(input_line, alignment = QtCore.Qt.AlignTop)
    
##    v_layout.addWidget(sorting_box, alignment = QtCore.Qt.AlignVCenter)
##    v_layout.addWidget(filter_box, alignment = QtCore.Qt.AlignBottom)

#==========================================================================
def create_top_widget():

    top_widget = QWidget()

    #Сортировка
    sorting_box = QComboBox(top_widget)
##    sorting_box.setGeometry(window_size_x - 450, 25, 250, 50)
    sorting_box.setFixedHeight(30)
    sorting_box.setStyleSheet( 'font:13px;font-family: Segoe Print;'+
                               'background:#FFFFFF;')
    sorting_box.addItems(["Наименование по возрастанию",
                          "Наименование по убыванию",
                          "Остаток по возрастанию",
                          "Остаток по убыванию",
                          "Стоимость по возрастанию",
                          "Стоимость по убыванию"])

#Фильтрация
    filter_box = QComboBox(top_widget)
#    filter_box.setGeometry(window_size_x - 175, 25, 150, 50)
    filter_box.setFixedHeight(30)
    filter_box.setStyleSheet('font:13px;font-family: Segoe Print;'+
                             'background:#FFFFFF;' )
    filter_box_list = ["Все типы"] + material_type_list
    filter_box.addItems(filter_box_list)
    filter_box.activated[str].connect(onFilterActivated)

#Поиск
    input_line = QLineEdit(parent = top_widget)
##    input_line.setGeometry(20, 25, 500, 50)
    input_line.setFixedHeight(30)
    input_line.setStyleSheet('font:13px;font-family: Segoe Print;'+
                             'background:#FFFFFF;' )
    input_line.setPlaceholderText ('Введите для поиска')

    h_layout = QHBoxLayout(top_widget)
    h_layout.addWidget(input_line)
    h_layout.addWidget(sorting_box)
    h_layout.addWidget(filter_box)

    top_widget.setLayout(h_layout)

    return top_widget

#==========================================================================
def onFilterActivated(text):
    print('onFilterActivated')

    G.where = text
    print(text)

    fill_table()

    
#==========================================================================
def create_table():
    print('create_table()')

    G.table = QTableWidget()  # Создаём таблицу
##    table.setGeometry( 0, 0, 1000, 900 )
##    G.table.setShowGrid(False)
    G.table.setSelectionBehavior(QAbstractItemView.SelectRows)
    G.table.setColumnCount(4)     # Устанавливаем три колонки
##    G.table.setRowCount(15)

    

##    for row in range(row_count):
##        G.table.setRowHeight( row, 70 )


    G.table.setColumnWidth(0, 50)
    G.table.setColumnWidth(1, 70)
    G.table.setColumnWidth(3, 150)
##    G.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
##    table.verticalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
##    G.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
##    G.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
    G.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
##    G.table.horizontalHeader().setSectionResizeMode(3, QHeaderView.Stretch)
##    table.verticalHeader().setSectionResizeMode(1, QHeaderView.Stretch)

    G.table.horizontalHeader().hide()
    G.table.verticalHeader().hide()

##    G.checkbox_1 = create_checkbox(1, 1)
##    G.checkbox_2 = create_checkbox(1, 1)
##      
##    G.table.setCellWidget(0, 0, G.checkbox_1)

    fill_table()
    
    return G.table

#==========================================================================
def fill_table():
    print('fill_table()')

    G.table.setRowCount(0)

    get_data()

    row_count  = len(G.rows)

#  0          1             2               3
#Checkbox, MaterialId, MaterialType, MaterialName,
#MaterialImage, MaterialNumStorage, MaterialNumMin, Поставщики
#       4               5                   6           7
    
    for r in range(row_count):

        G.table.insertRow(r)
        G.table.setRowHeight( r, 70 )

        image_path = G.rows[r][4]
        if image_path == '':
            image_path = 'picture.png'
        else:
            image_path = image_path.rpartition('\\')[-1]

        
        print (str(image_path) + ' - text')
        material_info = (G.rows[r][2]+' | ' + G.rows[r][3]+'\n' +
                         'Минимальное количество: '+(str(G.rows[r][6]))+'\n'+
                         'Поставщики: ' + G.rows[r][7])
        rest_info = str(G.rows[r][5])

        G.checkbox = create_checkbox()
        pixmap = create_pixmap(image_path)
        G.table.setCellWidget(r, 0, G.checkbox)
        G.table.setCellWidget(r, 1, pixmap)
        G.table.setItem(r, 2, QTableWidgetItem(material_info))
        G.table.setItem(r, 3, QTableWidgetItem('Остаток: ' + rest_info))
        continue
    
##    label = QLabel(parent = text =
##'''
##<body>
##<br>
##<img style="width: 176px; height: 176px;" alt=""
## src="file:\\\\G:\\0\\unnamed.jpg"><br>
##</body>
##''')
    
    
##    G.table.setCellWidget(1, 0, G.checkbox_2)
##    G.table.setItem(1, 1, QTableWidgetItem("Text2 in column 2"))
##    G.table.setItem(1, 2, QTableWidgetItem("Text2 in column 3"))

    return 


#==========================================================================
def create_checkbox(): #string_index, material_id):
    print('create_checkbox')

    def onClicked(class_id):

        print('onClicked')
        change_button_off = 0
        for i in range( G.table.rowCount() ):
            print( str(G.table.cellWidget(i,0)) )
            k = G.table.cellWidget(i,0)
            if k != None:
                if k.isChecked():
                    G.change_button.show()
                    change_button_off = 1
                print(k.isChecked())
            elif 0: pass
            
            continue
        if change_button_off == 0:
            G.change_button.hide()
        print('конец onClicked')
        return  
    
    checkbox_choose = QCheckBox()
##    checkbox_choose.material_id = material_id
##    checkbox_choose.string_index = string_index   
    checkbox_choose.toggled.connect(onClicked)

    print('конец create_checkbox')

    return checkbox_choose

#==========================================================================
def create_pixmap(image_path):

    pixmap_widget = QWidget()
    
    pixmap = QPixmap("C:\\Users\\n\\Desktop\\Подготовка к дему\\Разное\\materials\\"+
                     image_path)
    pixmap2 = pixmap.scaled(30, 30)
    
    label = QLabel(parent = pixmap_widget)    
    label.setPixmap(pixmap2)   
    label.resize( pixmap2.width(), pixmap2.height() )

    h_layout = QHBoxLayout(pixmap_widget)
    h_layout.addWidget(label)

    return pixmap_widget


#==========================================================================
def check_isOn(m):
    print('check_isOn')

    k = G.table.cellWidget(0,0)

    print(k.isChecked())
    
    print(str(k) + ' - k')
      

#==========================================================================
def get_data():
    print('get_data()')

    if G.where != 'Все типы':
        select_where =  " where MaterialType = '" + G.where + "'"
    else:
        select_where = ''

    
    G.order = ''    

    select_text =(
'''
select '' as Checkbox, MaterialId, MaterialType, MaterialName,
    coalesce(MaterialImage, '') as Mat_Image, MaterialNumStorage, MaterialNumMin,
coalesce (
(select supp_list.Mmmm from

( select distinct ST2.MaterialId, SUBSTRING (
		(
			select ',' + 
			(select SupplierName from Supplier where ST1.SupplierId = Supplier.SupplierId)
			from MaterialSupplier ST1
			where ST1.MaterialId = ST2.MaterialId
			order by ST1.MaterialId	FOR XML PATH ('')		
			), 2, 1000) [Mmmm]
from MaterialSupplier ST2) as supp_list 

where Material.MaterialId = supp_list.MaterialId
) , '') as Suppliers_list

from [Draft].[dbo].[Material]
''')
    select_exec = select_text + ' ' + select_where + ' '+ G.order
    print(select_exec)    
    cursor = cnxn.cursor()
    cursor.execute(select_exec)
    G.rows = cursor.fetchall()
##    G.rows

    print(G.rows)
    

#==========================================================================
def create_bottom_widget():

    bottom_widget = QWidget()

    add_button = QPushButton(parent = bottom_widget, text = 'Добавить материал')
    add_button.clicked.connect(check_isOn)

    G.change_button = QPushButton(parent = bottom_widget,
                                text = 'Изменить минимальное количество на ...')
    G.change_button.hide()

##    label = QLabel(parent = bottom_widget, text = 
##'''
##<body>
##<br>
##<img style="width: 16px; height: 16px;" alt=""
## src="file:C:\\Users\\n\\Desktop\\Подготовка к дему\\Разное\\materials\\material_25.jpeg">
## <br>
##</body>
##''')

##    pixmap = QPixmap("C:\\Users\\n\\Desktop\\Подготовка к дему\\Разное\\materials\\material_25.jpeg")
##    pixmap2 = pixmap.scaled(64, 64)
##    
##    label = QLabel(parent = bottom_widget)    
##    label.setPixmap(pixmap2)   
##    label.resize( pixmap2.width(), pixmap2.height() )

    h_layout = QHBoxLayout(bottom_widget)
    h_layout.addWidget(add_button)
    h_layout.addWidget(G.change_button)
##    h_layout.addWidget(label)

    bottom_widget.setLayout(h_layout)    

    

    return bottom_widget

#==========================================================================

core_app = QtWidgets.QApplication(sys.argv)

main_window = QtWidgets.QMainWindow()
main_window.setStyleSheet('background:#FFFFFF;')
main(main_window)

sys.exit(core_app.exec_())

##import sys
##from PyQt5.QtWidgets import (QWidget, QLabel,
##    QComboBox, QApplication)
##
##
##class Example(QWidget):
##
##    def __init__(self):
##        super().__init__()
##
##        self.initUI()
##
##
##    def initUI(self):
##
####        self.lbl = QLabel("Ubuntu", self)
##
##        combo = QComboBox(self)
##        combo.addItems(["Ubuntu", "Mandriva",
##                        "Fedora", "Arch", "Gentoo"])
##
####        combo.move(50, 50)
####        self.lbl.move(50, 150)
##
####        combo.activated[str].connect(self.onActivated)
##
####        self.setGeometry(300, 300, 300, 200)
####        self.setWindowTitle('QComboBox')
##        self.show()
##
##
####    def onActivated(self, text):
####
####        self.lbl.setText(text)
####        self.lbl.adjustSize()
##
##
##if __name__ == '__main__':
##
##    app = QApplication(sys.argv)
##    ex = Example()
##    sys.exit(app.exec_())
