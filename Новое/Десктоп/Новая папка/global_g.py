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

class globaldata:
    pass

global G
G = globaldata()

G.connection = pyodbc.connect(driver='{ODBC Driver 17 for SQL Server}',
                      server='HARZA-N\SQLEXPRESS', 
                      database='bd_dem',               
                      trusted_connection='yes')
