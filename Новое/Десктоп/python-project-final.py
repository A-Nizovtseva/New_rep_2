import os, configparser, sys, time, pyodbc
from PyQt5 import QtCore, QtGui, QtWidgets, QtSql, Qt
from PyQt5.QtWidgets import (QWidget, QPushButton, QLabel, QTableWidget, QAbstractItemView,
QLineEdit, QComboBox, QApplication, QHeaderView, QTableWidgetItem, QHBoxLayout, 
QVBoxLayout, QCheckBox, QDialog)
from PyQt5.QtGui import QPixmap

cnxn = pyodbc.connect(driver='{ODBC Driver 11 for SQL Server}',
                      server='N-PC\SQLEXPRESS', 
                      database='Draft',               
                      trusted_connection='yes')
##cursor = cnxn.cursor()
##cursor.execute("select MaterialType from Material group by MaterialType;")
####row = cursor.fetchone()
##rows = cursor.fetchall()
####empty = cursor.fetchall()
##
##material_type_list = []
##for i in range(len(rows)):
##    x = rows[i][0]
##    print( x )
##    material_type_list.append(x)
##    continue
##print(material_type_list) 

global G

class Global_data(): pass

G = Global_data()
    
G.where = 'Все типы'
G.order = 'Наименование по возрастанию'
G.find = ''

window_size_x = 1000
window_size_y = 950

#==========================================================================
def main(main_window):

    main_window.setGeometry(20, 40, window_size_x, window_size_y)
    main_window.setMinimumSize(800, 800)
    main_window.setWindowIcon(QtGui.QIcon('Черновик.ico'))
    main_window.setWindowTitle("Черновик")
    
    central_widget = QWidget(main_window)
    main_window.setCentralWidget(central_widget)

    v_layout = QVBoxLayout()
    central_widget.setLayout(v_layout)

    top_widget = create_top_widget()

    table_widget = create_table()

    bottom_widget = create_bottom_widget()
    
    v_layout.addWidget(top_widget, alignment = QtCore.Qt.AlignTop)
    v_layout.addWidget(table_widget) #, alignment = QtCore.Qt.AlignCenter)
    v_layout.addWidget(bottom_widget, alignment = QtCore.Qt.AlignBottom)
    
    main_window.show()
    
    return

#==========================================================================
def create_top_widget():

    top_widget = QWidget()
    top_widget.setStyleSheet('font:13px;font-family: Segoe Print;background:#FFFFFF')

    #Сортировка
    sorting_box = QComboBox(top_widget)
    sorting_box.setFixedHeight(30)
    sorting_box.setStyleSheet( 'font:13px;font-family: Segoe Print;'+
                               'background:#FFFFFF;')
    sorting_box.addItems(["Наименование по возрастанию",
                          "Наименование по убыванию",
                          "Остаток по возрастанию",
                          "Остаток по убыванию",
                          "Стоимость по возрастанию",
                          "Стоимость по убыванию"])
    sorting_box.activated[str].connect(onSortingActivated)

    G.count_rows_label = QLabel(parent = top_widget)
    G.count_rows_label.setFixedHeight(30)

#Фильтрация
    cursor = cnxn.cursor()
    cursor.execute("select MaterialType from Material group by MaterialType;")
    rows_find = cursor.fetchall()
    G.material_type_list = []
    for i in range(len(rows_find)):
        x = rows_find[i][0]
        G.material_type_list.append(x)
        continue
    
    filter_box = QComboBox(top_widget)
#    filter_box.setGeometry(window_size_x - 175, 25, 150, 50)
    filter_box.setFixedHeight(30)
    filter_box.setStyleSheet('font:13px;font-family: Segoe Print;'+
                             'background:#FFFFFF;' )
    filter_box_list = ["Все типы"] + G.material_type_list
    filter_box.addItems(filter_box_list)
    filter_box.activated[str].connect(onFilterActivated)

#Поиск
    input_line = QLineEdit(parent = top_widget)
##    input_line.setGeometry(20, 25, 500, 50)
    input_line.setFixedHeight(30)
    input_line.setStyleSheet('font:13px;font-family: Segoe Print;'+
                             'background:#FFFFFF;' )
    input_line.setPlaceholderText ('Введите для поиска')
    input_line.textChanged[str].connect(onTextFind)

    h_layout = QHBoxLayout(top_widget)
    h_layout.addWidget(input_line)
    h_layout.addWidget(G.count_rows_label)
    h_layout.addWidget(sorting_box)
    h_layout.addWidget(filter_box)

    top_widget.setLayout(h_layout)

    return top_widget

#==========================================================================
def onFilterActivated(text):
    print('onFilterActivated')

    G.where = text

    fill_table()

#==========================================================================
def onSortingActivated(text):
    print('onSortingActivated')

    G.order = text
    
    fill_table()

#==========================================================================
def onTextFind(text):
    print('onTextFind')
    
    G.find = text
    print(text)
    
    fill_table()
    
#==========================================================================
def create_table():
    print('create_table()')

    G.table = QTableWidget()  # Создаём таблицу
##    table.setGeometry( 0, 0, 1000, 900 )
##    G.table.setShowGrid(False)
    G.table.setStyleSheet('font:13px;font-family: Segoe Print;')
    G.table.setSelectionBehavior(QAbstractItemView.SelectRows)
    G.table.setColumnCount(4)     # Устанавливаем три колонки

    G.table.setColumnWidth(0, 50)
    G.table.setColumnWidth(1, 70)
    G.table.setColumnWidth(3, 150)

    G.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)

    G.table.horizontalHeader().hide()
    G.table.verticalHeader().hide()

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

        
##        print (str(image_path) + ' - text')
        material_info = (G.rows[r][2]+' | ' + G.rows[r][3]+'\n' +
                         'Минимальное количество: '+(str(G.rows[r][6]))+'\n'+
                         'Поставщики: ' + G.rows[r][7])
        min_value = G.rows[r][6]
        rest_info = G.rows[r][5]

        if rest_info < min_value :
            current_color = '#F19292'
        elif rest_info <= (min_value*3):
            current_color = '#FFBA01'
        else:
            current_color = '#FFFFFF'

        color = G.table.palette().window()
        color.setColor( QtGui.QColor( current_color ) )    # #FFFFF0 - Ivory
##        color_more = G.table.palette().window()
##        color_more.setColor( QtGui.QColor( current_color ) )



        G.checkbox = create_checkbox()
        G.checkbox.setStyleSheet('font:13px;font-family: Segoe Print;background:'+
                                 current_color + ';')
        G.table.setCellWidget(r, 0, G.checkbox)

        
        pixmap = create_pixmap(image_path)
        pixmap.setStyleSheet('font:13px;font-family: Segoe Print;background:#FFFFF0'+
                                 current_color + ';')
        G.table.setCellWidget(r, 1, pixmap)

        
        material_info_cell = QTableWidgetItem( material_info)
        material_info_cell.setBackground( color )
        G.table.setItem(r, 2, material_info_cell )

        
        rest_info_cell = QTableWidgetItem('Остаток: ' + str(rest_info))
        rest_info_cell.setBackground( color )
        G.table.setItem(r, 3, rest_info_cell)

        
        
        continue

    return 

#==========================================================================
def create_checkbox(): #string_index, material_id):
##    print('create_checkbox')

    def onClicked(class_id):

        change_button_off = 0
        for i in range( G.table.rowCount() ):
            k = G.table.cellWidget(i,0)
            if k != None:
                if k.isChecked():
                    G.change_button.show()
                    change_button_off = 1
            elif 0: pass
            
            continue
        if change_button_off == 0:
            G.change_button.hide()
        return  
    
    checkbox_choose = QCheckBox()
##    checkbox_choose.material_id = material_id
##    checkbox_choose.string_index = string_index   
    checkbox_choose.toggled.connect(onClicked)

##    print('конец create_checkbox')

    return checkbox_choose

#==========================================================================
def create_pixmap(image_path):

    pixmap_widget = QWidget()
    
##    pixmap = QPixmap("C:\\Users\\n\\Desktop\\Подготовка к дему\\Разное\\materials\\"+
##                     image_path)
    pixmap = QPixmap( ".\\materials\\" + image_path)

    
    pixmap2 = pixmap.scaled(30, 30)
    
    label = QLabel(parent = pixmap_widget)    
    label.setPixmap(pixmap2)   
    label.resize( pixmap2.width(), pixmap2.height() )

    h_layout = QHBoxLayout(pixmap_widget)
    h_layout.addWidget(label)

    return pixmap_widget

#==========================================================================
def get_data():
    print('get_data()')

    cursor = cnxn.cursor()
    cursor.execute("select count(*) from Material")
    rows_find = cursor.fetchall()
    global_row_count = rows_find[0][0]

    if G.where != 'Все типы':
        select_where =  " where MaterialType = '" + G.where + "'"
    else:
        select_where = 'where 1=1 '
        
    if G.find != '':
        select_order_fixed = ("and charindex('" + G.find + "', MaterialName) > 0 ")
    else:
        select_order_fixed = ''
        
    if G.order == 'Наименование по возрастанию':
        select_order = select_order_fixed + 'order by MaterialName ASC'
          
    elif G.order == 'Наименование по убыванию':
        select_order = select_order_fixed + 'order by MaterialName DESC'
        
    elif G.order == 'Остаток по возрастанию':
        select_order = select_order_fixed +  'order by MaterialNumStorage ASC'
            
    elif G.order == 'Остаток по убыванию':
        select_order = select_order_fixed +  'order by MaterialNumStorage DESC'
        
    elif G.order == 'Стоимость по возрастанию':
        select_order = select_order_fixed +  'order by MaterialPrice ASC'
            
    elif G.order == 'Стоимость по убыванию':
        select_order = select_order_fixed +  'order by MaterialPrice DESC'
           

    select_text =(
'''
select '' as Checkbox, MaterialId, MaterialType, MaterialName,
    coalesce(MaterialImage, '') as Mat_Image, MaterialNumStorage, MaterialNumMin,
coalesce (
(select supp_list.Mmmm from

( select distinct ST2.MaterialId, SUBSTRING (
		(
			select ', ' + 
			(select SupplierName from Supplier where ST1.SupplierId = Supplier.SupplierId)
			from MaterialSupplier ST1
			where ST1.MaterialId = ST2.MaterialId
			order by ST1.MaterialId	FOR XML PATH ('')		
			), 3, 1000) [Mmmm]
from MaterialSupplier ST2) as supp_list 

where Material.MaterialId = supp_list.MaterialId
) , '') as Suppliers_list, MaterialPrice

from [Draft].[dbo].[Material]
''')
    select_exec = select_text + ' ' + select_where + ' '+ select_order
##    print(select_exec)    
    cursor = cnxn.cursor()
    cursor.execute(select_exec)
    G.rows = cursor.fetchall()
    
    current_row_count = len(G.rows)

    G.count_rows_label.setText(str(len(G.rows))+' из '+str(global_row_count))

#==========================================================================
def create_bottom_widget():

    bottom_widget = QWidget()
    bottom_widget.setStyleSheet('font:13px;font-family: Segoe Print;')

    add_button = QPushButton(parent = bottom_widget, text = 'Добавить материал')
    add_button.clicked.connect(add_material_window)

    G.change_button = QPushButton(parent = bottom_widget,
                                text = 'Изменить минимальное количество на ...')
    G.change_button.clicked.connect(onChangeMin)
    G.change_button.hide()

    h_layout = QHBoxLayout(bottom_widget)
    h_layout.addWidget(add_button)
    h_layout.addWidget(G.change_button)
##    h_layout.addWidget(label)

    bottom_widget.setLayout(h_layout)    

    return bottom_widget

#==========================================================================
def add_material_window():
    print('add_material_window')

    def dialog_close():
        print('dialog_close()')
        G.close_flag = 1
        add_window.close()
        return
    print(1)
    
    G.close_flag = 0

    add_window = QDialog()
    add_window.setGeometry(50, 50, 500, 500)
    add_window.setStyleSheet( 'font:13px;font-family: Segoe Print;'+
                               'background:#FFFFFF;')

    name_label = QLabel(parent = add_window, text = 'Наименование: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)
    type_label = QLabel(parent = add_window, text = 'Тип материала: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)
    storage_num_label = QLabel(parent = add_window, text = 'Количество на складе: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)
    measure_label = QLabel(parent = add_window, text = 'Единица измерения: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)
    num_package_label = QLabel(parent = add_window, text = 'Количество в упаковке: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)
    num_min_label = QLabel(parent = add_window, text = 'Минимальное количество: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)
    price_label = QLabel(parent = add_window, text = 'Стоимость за единицу: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)
    image_label = QLabel(parent = add_window, text = 'Изображение: ',
                        alignment = QtCore.Qt.AlignRight | QtCore.Qt.AlignVCenter)

    width_label = 200
    y_label = 50
    
    name_label.setGeometry          (10, y_label-50,   width_label, 50)
    type_label.setGeometry          (10, y_label+0,   width_label, 50)
    storage_num_label.setGeometry   (10, y_label+50,  width_label, 50)
    measure_label.setGeometry       (10, y_label+100, width_label, 50)
    num_package_label.setGeometry   (10, y_label+150, width_label, 50)
    num_min_label.setGeometry       (10, y_label+200, width_label, 50)
    price_label.setGeometry         (10, y_label+250, width_label, 50)
    image_label.setGeometry         (10, y_label+300, width_label, 50)

    print(2)

    name_edit = QLineEdit(parent = add_window)
    type_box = QComboBox(parent = add_window)
    type_box.addItems(G.material_type_list)
    storage_num_edit = QLineEdit(parent = add_window)
    measure_edit = QLineEdit(parent = add_window)
    num_package_edit = QLineEdit(parent = add_window)
    num_min_edit = QLineEdit(parent = add_window)
    price_edit = QLineEdit(parent = add_window)
    image_edit = QLineEdit(parent = add_window)

    x_edit = 250
    y_edit = 50
    width_edit = 200

    print(2.2)

    name_edit.setGeometry          (x_edit, y_edit-50,  width_edit, 50)
    type_box.setGeometry           (x_edit, y_edit+0,   width_edit, 50)
    storage_num_edit.setGeometry   (x_edit, y_edit+50,  width_edit, 50)
    measure_edit.setGeometry       (x_edit, y_edit+100, width_edit, 50)
    num_package_edit.setGeometry   (x_edit, y_edit+150, width_edit, 50)
    num_min_edit.setGeometry       (x_edit, y_edit+200, width_edit, 50)
    price_edit.setGeometry         (x_edit, y_edit+250, width_edit, 50)
    image_edit.setGeometry         (x_edit, y_edit+300, width_edit, 50)

    print(2.3)

    commit_button = QPushButton(parent = add_window, text = 'Добавить')
    commit_button.setGeometry (x_edit-100, y_edit+375,   width_edit, 50)
    commit_button.clicked.connect(dialog_close)

    add_window.exec_()

    print(3)  
    print(G.close_flag)
    if G.close_flag == 1:
        insert_command_base = (
'''
INSERT INTO [dbo].[Material]
           ([MaterialName]
           ,[MaterialType]
           ,[MaterialImage]
           ,[MaterialPrice]
           ,[MaterialNumStorage]
           ,[MaterialNumMin]
           ,[MaterialNumPackage]
           ,[MaterialMeasureType])
VALUES ( 
''')
        print(2)
        insert_command = (insert_command_base +
                        " '"+name_edit.text() + "', '"
                        +type_box.currentText() + "', '"
                        +image_edit.text() + "', "
                        +price_edit.text() + ", "
                        +storage_num_edit.text() + ", "
                        +num_min_edit.text() + ", "
                        +num_package_edit.text() + ", '"
                        +measure_edit.text() + "')")

        print(insert_command)

        cursor = cnxn.cursor()
        cursor.execute(insert_command)
        cursor.commit()

        fill_table()
        
##     VALUES ( '111', '222', '333', 444, 555, 666, 777, '888')    

#==========================================================================
def onChangeMin():
    print('onChangeMin')

    new_min_value = window_change_min()
    
    for i in range( G.table.rowCount() ):
        k = G.table.cellWidget(i,0)
        if k != None:
            if k.isChecked():                
                onChangeMin_exec(G.rows[i][1], new_min_value)
                print(G.rows[i][1], G.rows[i][3])
        elif 0: pass
            
        continue
    G.change_button.hide()

    fill_table()
    
#==========================================================================
def window_change_min():
    print('window_change_min()')

    def dialog_close():
        print('dialog_close()')
        G.close_flag = 1
        change_min_window.close()
        return

    G.close_flag = 0
    
    change_min_window = QDialog()
    change_min_window.setGeometry(100, 100, 500, 100)
    change_min_window.setStyleSheet( 'font:13px;font-family: Segoe Print;'+
                               'background:#FFFFFF;')

    
    question_label = QLabel(parent = change_min_window,
                            text = 'Изменить минимальное количество на: ')
    question_label.setGeometry(0, 0, 300, 40)

    input_line = QLineEdit(parent = change_min_window)
    input_line.setGeometry(310, 0, 200, 40)
    input_line.setInputMask('999999999')
    input_line.setText(get_max_value())

    commit_button = QPushButton(parent = change_min_window, text = 'Изменить')
    commit_button.setGeometry(150, 50, 100, 40)
    commit_button.clicked.connect(dialog_close)

    change_min_window.exec_()

    return_min_value = input_line.text()

    print('конец window_change_min()')
    
    return return_min_value

#==========================================================================
def get_max_value():

    cursor = cnxn.cursor()
    cursor.execute("select max(MaterialNumMin) from Material")
    max_value = cursor.fetchall()

    return str(max_value[0][0])

#==========================================================================
def onChangeMin_exec(material_id, new_min_value):
    print('onChangeMin_exec')
    print(G.close_flag)
    if G.close_flag == 1:
        update_min = ('update Material set MaterialNumMin = ' + str(new_min_value)+
                        ' where MaterialId = '+str(material_id))
        print(update_min)
        cursor = cnxn.cursor()
        cursor.execute(update_min)
        cursor.commit()

#==========================================================================

core_app = QtWidgets.QApplication(sys.argv)

main_window = QtWidgets.QMainWindow()
main_window.setStyleSheet('background:#FFFFFF;')
main(main_window)

sys.exit(core_app.exec_())
