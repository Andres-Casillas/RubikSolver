from collections import deque
import colorama
WHITE = colorama.Fore.WHITE
RED = colorama.Fore.RED
YELLOW = "\033[38;2;255;255;0m"
ORANGE = "\033[38;2;255;155;50m"
GREEN =colorama.Fore.GREEN
BLUE = colorama.Fore.BLUE
PINK = "\033[38;2;255;0;255m"
RESET = colorama.Style.RESET_ALL
colorama.init()

movimientos = []

def simplificar(moves):
    simples = deque()
    
    i = 0
    while i < len(moves):
        face = moves[i].replace("'", "").replace("2", "")
        count = 0
        while i < len(moves) and moves[i].replace("'", "").replace("2", "") == face:
            move = moves[i]
            if move.endswith("'"):
                count -= 1
            elif move.endswith("2"):
                count += 2
            else:
                count += 1
            i += 1

        count = count % 4
        if count == 1:
            simples.append(face)
        elif count == 2:
            simples.append(face + "2")
        elif count == 3:
            simples.append(face + "'")

    return list(simples)

def printi(cubito):
    if(cubito == "W"):
        print(WHITE + "■" + RESET, end=" ")
    if(cubito == "R"):
        print(RED + "■" + RESET, end=" ")
    if(cubito == "Y"):
        print(YELLOW + "■" + RESET, end=" ")
    if(cubito == "O"):
        print(ORANGE + "■" + RESET, end=" ")
    if(cubito == "G"):
        print(GREEN + "■" + RESET, end=" ")
    if(cubito == "B"):
        print(BLUE + "■" + RESET, end=" ")
    if(cubito == "P"):
        print(PINK + "■" + RESET, end=" ")

def rotar_matriz(matriz, string):
    if(string == "horario"):
        # Transponer la matriz
        transpuesta = [list(fila) for fila in zip(*matriz)]
        # Invertir cada fila para obtener la rotación en sentido antihorario
        rotada = [fila[::-1] for fila in transpuesta]
        return rotada
        
    if(string == "antihorario"):
        # Transponer la matriz
        transpuesta = [list(fila) for fila in zip(*matriz)]
        # Invertir cada fila para obtener la rotación en sentido antihorario
        rotada = [fila for fila in transpuesta[::-1]]
        return rotada

    if(string == "espejo"):
        # Invertir cada fila para obtener la rotación en sentido antihorario
        rotada = [fila[::-1] for fila in matriz]
        return rotada

    if(string == "invertida"):
        # Invertir cada fila para obtener la rotación en sentido antihorario
        rotada = matriz[::-1]
        return rotada


class CuboRubik:
    def __init__(self, cubo=None):
        self.cubo = cubo if cubo is not None else []
        movimientos.clear()

    
    def rotacion(self, string):
        #           ROTACIONES VERTICALES
        #                R L M

        if(string == "R"):
            movimientos.append(string)
            temp = [fila[2][0] for fila in self.cubo[0]]
            for i in range(3):
                self.cubo[0][i][2] = self.cubo[1][i][2]
            for i in range(3):
                self.cubo[1][i][2] = self.cubo[2][i][2]
            for i in range(3):
                self.cubo[2][i][2] = self.cubo[3][2 - i][2]
            for i in range(3):
                self.cubo[3][i][2] = temp[i]
            
            self.cubo[3][0][2], self.cubo[3][1][2], self.cubo[3][2][2] = self.cubo[3][2][2], self.cubo[3][1][2], self.cubo[3][0][2]
            self.cubo[5] = rotar_matriz(self.cubo[5], "horario")
        if(string == "R'"):
            movimientos.append(string)
            temp = [fila[2][0] for fila in self.cubo[0]]
            for i in range(3):
                self.cubo[0][i][2] = self.cubo[3][i][2]
            for i in range(3):
                self.cubo[3][i][2] = self.cubo[2][2 - i][2]
            for i in range(3):
                self.cubo[2][i][2] = self.cubo[1][i][2]
            for i in range(3):
                self.cubo[1][i][2] = temp[i]
            
            self.cubo[0][0][2], self.cubo[0][1][2], self.cubo[0][2][2] = self.cubo[0][2][2], self.cubo[0][1][2], self.cubo[0][0][2]
            self.cubo[5] = rotar_matriz(self.cubo[5], "antihorario")
        
        if(string == "L"):
            movimientos.append(string)
            temp = [fila[0][0] for fila in self.cubo[0]]
            for i in range(3):
                self.cubo[0][i][0] = self.cubo[3][i][0]
            for i in range(3):
                self.cubo[3][i][0] = self.cubo[2][2 - i][0]
            for i in range(3):
                self.cubo[2][i][0] = self.cubo[1][i][0]
            for i in range(3):
                self.cubo[1][i][0] = temp[i]
            
            self.cubo[0][0][0], self.cubo[0][1][0], self.cubo[0][2][0] = self.cubo[0][2][0], self.cubo[0][1][0], self.cubo[0][0][0]
            self.cubo[4] = rotar_matriz(self.cubo[4], "horario")
        if(string == "L'"):
            movimientos.append(string)
            temp = [fila[0][0] for fila in self.cubo[0]]
            for i in range(3):
                self.cubo[0][i][0] = self.cubo[1][i][0]
            for i in range(3):
                self.cubo[1][i][0] = self.cubo[2][i][0]
            for i in range(3):
                self.cubo[2][i][0] = self.cubo[3][2 - i][0]
            for i in range(3):
                self.cubo[3][i][0] = temp[i]
            
            self.cubo[3][0][0], self.cubo[3][1][0], self.cubo[3][2][0] = self.cubo[3][2][0], self.cubo[3][1][0], self.cubo[3][0][0]
            self.cubo[4] = rotar_matriz(self.cubo[4], "antihorario")

        if(string == "M"):
            movimientos.append(string)
            temp = [fila[1][0] for fila in self.cubo[0]]
            for i in range(3):
                self.cubo[0][i][1] = self.cubo[3][i][1]
            for i in range(3):
                self.cubo[3][i][1] = self.cubo[2][2 - i][1]
            for i in range(3):
                self.cubo[2][i][1] = self.cubo[1][i][1]
            for i in range(3):
                self.cubo[1][i][1] = temp[i]
            
            self.cubo[0][0][1], self.cubo[0][1][1], self.cubo[0][2][1] = self.cubo[0][2][1], self.cubo[0][1][1], self.cubo[0][0][1]
        if(string == "M'"):
            movimientos.append(string)
            temp = [fila[1][0] for fila in self.cubo[0]]
            for i in range(3):
                self.cubo[0][i][1] = self.cubo[1][i][1]
            for i in range(3):
                self.cubo[1][i][1] = self.cubo[2][i][1]
            for i in range(3):
                self.cubo[2][i][1] = self.cubo[3][2 - i][1]
            for i in range(3):
                self.cubo[3][i][1] = temp[i]
            
            self.cubo[3][0][1], self.cubo[3][1][1], self.cubo[3][2][1] = self.cubo[3][2][1], self.cubo[3][1][1], self.cubo[3][0][1]

        #           ROTACIONES HORIZONTALES
        #                U E D

        if(string == "U"):
            movimientos.append(string)
            temp = self.cubo[1][0]
            self.cubo[1][0] = self.cubo[5][0]
            self.cubo[5][0] = self.cubo[3][0]
            self.cubo[3][0] = self.cubo[4][0]
            self.cubo[4][0] = temp
            
            self.cubo[3][0] = list(reversed(self.cubo[3][0]))
            self.cubo[5][0] = list(reversed(self.cubo[5][0]))
            self.cubo[0] = rotar_matriz(self.cubo[0], "horario")
        if(string == "U'"):
            movimientos.append(string)
            temp = self.cubo[1][0]
            self.cubo[1][0] = self.cubo[4][0]
            self.cubo[4][0] = self.cubo[3][0]
            self.cubo[3][0] = self.cubo[5][0]
            self.cubo[5][0] = temp

            self.cubo[3][0] = list(reversed(self.cubo[3][0]))
            self.cubo[4][0] = list(reversed(self.cubo[4][0]))
            self.cubo[0] = rotar_matriz(self.cubo[0], "antihorario")

        if(string == "E"):
            movimientos.append(string)
            temp = self.cubo[1][1]
            self.cubo[1][1] = self.cubo[4][1]
            self.cubo[4][1] = self.cubo[3][1]
            self.cubo[3][1] = self.cubo[5][1]
            self.cubo[5][1] = temp

            self.cubo[3][1] = list(reversed(self.cubo[3][1]))
            self.cubo[4][1] = list(reversed(self.cubo[4][1]))
        if(string == "E'"):
            movimientos.append(string)
            temp = self.cubo[1][1]
            self.cubo[1][1] = self.cubo[5][1]
            self.cubo[5][1] = self.cubo[3][1]
            self.cubo[3][1] = self.cubo[4][1]
            self.cubo[4][1] = temp
            
            self.cubo[3][1] = list(reversed(self.cubo[3][1]))
            self.cubo[5][1] = list(reversed(self.cubo[5][1]))

        if(string == "D"):
            movimientos.append(string)
            temp = self.cubo[1][2]
            self.cubo[1][2] = self.cubo[4][2]
            self.cubo[4][2] = self.cubo[3][2]
            self.cubo[3][2] = self.cubo[5][2]
            self.cubo[5][2] = temp

            self.cubo[3][2] = list(reversed(self.cubo[3][2]))
            self.cubo[4][2] = list(reversed(self.cubo[4][2]))            
            self.cubo[2] = rotar_matriz(self.cubo[2], "horario")
        if(string == "D'"):
            movimientos.append(string)
            temp = self.cubo[1][2]
            self.cubo[1][2] = self.cubo[5][2]
            self.cubo[5][2] = self.cubo[3][2]
            self.cubo[3][2] = self.cubo[4][2]
            self.cubo[4][2] = temp
            
            self.cubo[3][2] = list(reversed(self.cubo[3][2]))
            self.cubo[5][2] = list(reversed(self.cubo[5][2]))
            self.cubo[2] = rotar_matriz(self.cubo[2], "antihorario")
        
        #           ROTACION FRONTAL 
        #                   F
        if(string == "F"):
            movimientos.append(string)
            temp = self.cubo[0][2]
            self.cubo[0][2] = [fila[2] for fila in reversed(self.cubo[4])]
            for i in range(3):
                self.cubo[4][i][2] = self.cubo[2][0][i]
            self.cubo[2][0] = [fila[0] for fila in reversed(self.cubo[5])]
            for i in range(3):
                self.cubo[5][i][0] = temp[i]

            self.cubo[1] = rotar_matriz(self.cubo[1], "horario")
        if(string == "F'"):
            movimientos.append(string)
            temp = self.cubo[0][2]
            self.cubo[0][2] = [fila[0] for fila in self.cubo[5]]
            for i in range(3):
                self.cubo[5][i][0] = self.cubo[2][0][i]
            self.cubo[2][0] = [fila[2] for fila in self.cubo[4]]
            for i in range(3):
                self.cubo[4][i][2] = temp[i]

            self.cubo[5][0][0], self.cubo[5][1][0], self.cubo[5][2][0] = self.cubo[5][2][0], self.cubo[5][1][0], self.cubo[5][0][0]
            self.cubo[4][0][2], self.cubo[4][1][2], self.cubo[4][2][2] = self.cubo[4][2][2], self.cubo[4][1][2], self.cubo[4][0][2]
            self.cubo[1] = rotar_matriz(self.cubo[1], "antihorario")

        #           ROTACIONES ANCHAS
        #                   r l f d

        if(string == "f"):
            temp = self.cubo[0][1]
            self.cubo[0][1] = [fila[1] for fila in reversed(self.cubo[4])]
            for i in range(3):
                self.cubo[4][i][1] = self.cubo[2][1][i]
            self.cubo[2][1] = [fila[1] for fila in reversed(self.cubo[5])]
            for i in range(3):
                self.cubo[5][i][1] = temp[i]
            self.rotacion("F")
            movimientos.pop()
            movimientos.append(string)
        if(string == "f'"):
            temp = self.cubo[0][1]
            self.cubo[0][1] = [fila[1] for fila in self.cubo[5]]
            for i in range(3):
                self.cubo[5][i][1] = self.cubo[2][1][i]
            self.cubo[2][1] = [fila[1] for fila in self.cubo[4]]
            for i in range(3):
                self.cubo[4][i][1] = temp[i]

            self.cubo[5][0][1], self.cubo[5][1][1], self.cubo[5][2][1] = self.cubo[5][2][1], self.cubo[5][1][1], self.cubo[5][0][1]
            self.cubo[4][0][1], self.cubo[4][1][1], self.cubo[4][2][1] = self.cubo[4][2][1], self.cubo[4][1][1], self.cubo[4][0][1]
            self.rotacion("F'")
            movimientos.pop()
            movimientos.append(string)

        if(string == "r"):
            self.rotacion("R")
            self.rotacion("M'")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)
        if(string == "r'"):
            self.rotacion("R'")
            self.rotacion("M")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)
        
        if(string == "d"):
            self.rotacion("D")
            self.rotacion("E")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)
        if(string == "d'"):
            self.rotacion("D'")
            self.rotacion("E'")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)

        #           ROTACIONES DOBLES
        #                 R2 L2 M2 U2

        if(string == "L2"):
            self.rotacion("L")
            self.rotacion("L")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)

        if(string == "R2"):
            self.rotacion("R")
            self.rotacion("R")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)

        if(string == "M2"):
            self.rotacion("M")
            self.rotacion("M")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)

        if(string == "U2"):
            self.rotacion("U")
            self.rotacion("U")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)

        if(string == "F2"):
            self.rotacion("F")
            self.rotacion("F")
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)

        #           ROTACIONES DE EJE
        #                   y

        if(string == "y"):
            self.rotacion("U")
            self.rotacion("E'")
            self.rotacion("D'")
            movimientos.pop()
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)
        if(string == "y'"):
            self.rotacion("U'")
            self.rotacion("E")
            self.rotacion("D")
            movimientos.pop()
            movimientos.pop()
            movimientos.pop()
            movimientos.append(string)

      
    def cruz(self):
        centrob = self.cubo[2][1][1]
        up = [self.cubo[0][0][1], self.cubo[0][1][0], self.cubo[0][1][2], self.cubo[0][2][1]]
        bot = [self.cubo[2][0][1], self.cubo[2][1][0], self.cubo[2][1][2], self.cubo[2][2][1]]
        blancus = [self.cubo[1][0][1], self.cubo[3][0][1], self.cubo[4][0][1], self.cubo[5][0][1]]
        fronts = [self.cubo[1][1][0], self.cubo[1][1][2], self.cubo[5][1][0], self.cubo[5][1][2], self.cubo[3][1][2], self.cubo[3][1][0], self.cubo[4][1][0], self.cubo[4][1][2]]
        ultis = [self.cubo[1][2][1], self.cubo[5][2][1], self.cubo[3][2][1], self.cubo[4][2][1]]

        upi = all(elemento == centrob for elemento in up)
        boti = all(elemento == centrob for elemento in bot)
        
        if(boti):
            #print("CRUZ COMPLETA")
            centros = [ultis[0]==self.cubo[1][1][1], ultis[1]==self.cubo[5][1][1], ultis[2]==self.cubo[3][1][1], ultis[3]==self.cubo[4][1][1]]
            #print(centros)
            if(all(elemento == True for elemento in centros)):
                print("      CRUZ COMPLETA")
            else:
                if(centros.count(True) == 2):
                    if((centros[0] and centros[2]) or (centros[1] and centros[3])):
                        if(centros[0] and centros[2]):
                            self.rotacion("D")
                            self.rotacion("M2")
                            self.rotacion("U2")
                            self.rotacion("M2")
                            self.rotacion("D'")
                        else:
                            self.rotacion("M2")
                            self.rotacion("U2")
                            self.rotacion("M2")
                    elif((centros[0] and centros[1]) or (centros[0] and centros[3]) or (centros[2] and centros[1]) or (centros[2] and centros[3])):
                        if(centros[0] and centros[1]):
                            self.rotacion("L")
                            self.rotacion("D")
                            self.rotacion("L'")
                            self.rotacion("D'")
                            self.rotacion("L")
                        elif(centros[0] and centros[3]):
                            self.rotacion("R'")
                            self.rotacion("D'")
                            self.rotacion("R")
                            self.rotacion("D")
                            self.rotacion("R'")
                        elif(centros[2] and centros[1]):
                            self.rotacion("L")
                            self.rotacion("D'")
                            self.rotacion("L'")
                            self.rotacion("D")
                            self.rotacion("L")
                        elif(centros[2] and centros[3]):
                            self.rotacion("R'")
                            self.rotacion("D")
                            self.rotacion("R")
                            self.rotacion("D'")
                            self.rotacion("R'")
                else:
                    self.rotacion("D'")
                self.cruz()
        else:
            if(up[0] == centrob) or (up[1] == centrob) or (up[2] == centrob) or (up[3] == centrob):
                if(up[1] == centrob):
                    if(bot[1] == centrob):
                        self.rotacion("D")
                    else:
                        self.rotacion("L2")
                elif(up[2] == centrob):
                    if(bot[2] == centrob):
                        self.rotacion("D")
                    else:
                        self.rotacion("R2") 
                else:
                    self.rotacion("U")
                self.cruz()
            elif(blancus[0] == centrob) or (blancus[1] == centrob) or (blancus[2] == centrob) or (blancus[3] == centrob):
                    if(blancus[2] == centrob):
                        if(bot[0] == centrob):
                            self.rotacion("D")
                        else:
                            self.rotacion("L")
                            self.rotacion("F'")
                            self.rotacion("L'")
                            self.rotacion("D'")
                    elif(blancus[3] == centrob):
                        if(bot[0] == centrob):
                            self.rotacion("D")
                        else:
                            self.rotacion("R'")
                            self.rotacion("F")
                            self.rotacion("R")
                            self.rotacion("D'")
                    else:
                        self.rotacion("U")
                    self.cruz()
            elif((fronts[0] == centrob) or (fronts[1] == centrob) or (fronts[2] == centrob) or (fronts[3] == centrob) or (fronts[4] == centrob) or (fronts[5] == centrob) or (fronts[6] == centrob) or (fronts[7] == centrob)):
                if(fronts[0] == centrob):
                    if(bot[1] == centrob):
                        self.rotacion("D")
                    else:
                        self.rotacion("L")
                if(fronts[1] == centrob):
                    if(bot[2] == centrob):
                        self.rotacion("D")
                    else:
                        self.rotacion("R'") 
                else:  
                    self.rotacion("y")
                self.cruz()
            elif(ultis[0] == centrob) or (ultis[1] == centrob) or (ultis[2] == centrob) or (ultis[3] == centrob):
                if(ultis[0] == centrob):
                    self.rotacion("F'")
                    self.rotacion("D")
                    self.rotacion("R'")
                    self.rotacion("D'")
                else:
                    self.rotacion("D")
                self.cruz()


    def f2l(self):
        abajo = [elemento for fila in self.cubo[2] for elemento in fila]
        frontal = [self.cubo[1][1][0], self.cubo[1][1][2], self.cubo[1][2][0], self.cubo[1][2][1], self.cubo[1][2][2]]
        atras = [self.cubo[3][1][0], self.cubo[3][1][2], self.cubo[3][2][0], self.cubo[3][2][1], self.cubo[3][2][2]]
        izq = [self.cubo[4][1][0], self.cubo[4][1][2], self.cubo[4][2][0], self.cubo[4][2][1], self.cubo[4][2][2]]
        der = [self.cubo[5][1][0], self.cubo[5][1][2], self.cubo[5][2][0], self.cubo[5][2][1], self.cubo[5][2][2]]

        
        frontal1 = all(elemento == self.cubo[1][1][1] for elemento in frontal)
        atras1 = all(elemento == self.cubo[3][1][1] for elemento in atras)
        izq1 = all(elemento == self.cubo[4][1][1] for elemento in izq)
        der1 = all(elemento == self.cubo[5][1][1] for elemento in der)
        lados = [frontal1, atras1, izq1, der1]

        centrob = self.cubo[2][1][1]
        cornersb = [self.cubo[4][0][0], self.cubo[3][0][0], self.cubo[3][0][2], self.cubo[5][0][2]]
        cornersf = [self.cubo[4][0][2], self.cubo[1][0][0], self.cubo[1][0][2], self.cubo[5][0][0]]
        cornerst = [self.cubo[0][0][0], self.cubo[0][0][2], self.cubo[0][2][0], self.cubo[0][2][2]]
        centru = [self.cubo[1][0][1], self.cubo[3][0][1], self.cubo[4][0][1], self.cubo[5][0][1]]
        centrop = [self.cubo[0][0][1], self.cubo[0][1][0], self.cubo[0][1][2], self.cubo[0][2][1]]
        
        if centrob in cornersf or centrob in cornersb:
            if(cornersf[0] == centrob or cornersf[3] == centrob):
                if(cornersf[3] == centrob):
                    if(cornersf[2] != self.cubo[1][1][1]):
                        self.rotacion("d")
                        self.f2l()
                    else:
                        if((centru[0] == cornersf[2]) and (centrop[3] == cornerst[3])):
                            #print("1")
                            self.rotacion("U'")
                            self.rotacion("F'")
                            self.rotacion("U")
                            self.rotacion("F")
                        elif((centru[0] == cornerst[3]) and (centrop[3] == cornersf[2])):
                            #print("2")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            self.rotacion("U")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            self.rotacion("U2")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                        elif((centru[1] == cornersf[2]) and (centrop[0] == cornerst[3])):
                            #print("3")
                            self.rotacion("y'")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("U2")
                            self.rotacion("R")
                            self.rotacion("U2")
                            self.rotacion("R'")
                            self.rotacion("U")
                            self.rotacion("R")
                        elif((centru[1] == cornerst[3]) and (centrop[0] == cornersf[2])):
                            #print("4")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                        elif((centru[2] == cornersf[2]) and (self.cubo[0][1][0] == cornerst[3])):
                            #print("5")
                            self.rotacion("U")
                            self.rotacion("F'")
                            self.rotacion("U'")
                            self.rotacion("F")
                            self.rotacion("U2")
                            self.rotacion("F'")
                            self.rotacion("U")
                            self.rotacion("F")
                        elif((centru[2] == cornerst[3]) and (self.cubo[0][1][0] == cornersf[2])):
                            #print("6")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("U")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                        elif((centru[3] == cornersf[2]) and (centrop[2] == cornerst[3])):
                            #print("7")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            self.rotacion("U2")
                            self.rotacion("F'")
                            self.rotacion("U'")
                            self.rotacion("F")
                        elif((centru[3] == cornerst[3]) and (centrop[2] == cornersf[2])):
                            #print("8")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            self.rotacion("U")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                        elif((self.cubo[1][1][2] == cornersf[2]) and (self.cubo[5][1][0] == cornerst[3])):
                            #print("9")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U2")
                            self.rotacion("R'")
                            self.rotacion("U")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                        elif((self.cubo[1][1][2] == cornerst[3]) and (self.cubo[5][1][0] == cornersf[2])):
                            #print("10")
                            self.rotacion("d")
                            self.rotacion("R'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("d'")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                        else:
                            #print("11")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("d")
                        #print("590")
                        #self.mostrar_cubo2()
                        self.f2l()
                elif(cornersf[0] == centrob):
                    if(cornersf[1] != self.cubo[1][1][1]):
                        self.rotacion("d")
                        self.f2l()
                    else:
                        if((centru[0] == cornersf[1]) and (centrop[3] == cornerst[2])):
                            self.rotacion("y'")
                            self.rotacion("U")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                        elif((centru[0] == cornerst[2]) and (centrop[3] == cornersf[1])):
                            self.rotacion("y'")
                            self.rotacion("U'")
                            self.rotacion("F'")
                            self.rotacion("U2")
                            self.rotacion("F")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("U'")
                        elif((centru[1] == cornersf[1]) and (centrop[0] == cornerst[2])):
                            self.rotacion("y'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U2")
                            self.rotacion("R'")
                            self.rotacion("U2")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                        elif((centru[1] == cornerst[2]) and (centrop[0] == cornersf[1])):
                            self.rotacion("y'")
                            self.rotacion("F'")
                            self.rotacion("U'")
                            self.rotacion("F")
                        elif((centru[2] == cornersf[1]) and (self.cubo[0][1][0] == cornerst[2])):
                            self.rotacion("y'")
                            self.rotacion("F'")
                            self.rotacion("U")
                            self.rotacion("F")
                            self.rotacion("U2")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                        elif((centru[2] == cornerst[2]) and (self.cubo[0][1][0] == cornersf[1])):
                            self.rotacion("y'")
                            self.rotacion("d")
                            self.rotacion("R'")
                            self.rotacion("U")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            self.rotacion("U'")
                            self.rotacion("R")
                        elif((centru[3] == cornersf[1]) and (centrop[2] == cornerst[2])):
                            self.rotacion("y'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U2")
                            self.rotacion("R'")
                        elif((centru[3] == cornerst[2]) and (centrop[2] == cornersf[1])):
                            self.rotacion("y'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            self.rotacion("U")
                            self.rotacion("F'")
                            self.rotacion("U'")
                            self.rotacion("F")
                        elif((self.cubo[4][1][2] == cornersf[1]) and (self.cubo[1][1][0] == cornerst[2])):
                            self.rotacion("y'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U")
                            self.rotacion("R'")
                            self.rotacion("d")
                            self.rotacion("R'")
                            self.rotacion("U'")
                            self.rotacion("R")
                        elif((self.cubo[4][1][2] == cornerst[2]) and (self.cubo[1][1][0] == cornersf[1])):
                            self.rotacion("y'")
                            self.rotacion("U'")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            self.rotacion("U2")
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                        else:
                            self.rotacion("L'")
                            self.rotacion("U'")
                            self.rotacion("L")
                        self.f2l()
            elif(cornersf[1] == centrob or cornersf[2] == centrob):
                if(cornersf[1] == centrob):
                    self.rotacion("U'")
                elif(cornersf[2] == centrob):
                    self.rotacion("U")
                self.f2l()
            elif(cornersb[0] == centrob or cornersb[2] == centrob):
                if(cornersb[0] == centrob):
                    self.rotacion("U")
                self.rotacion("U")
                self.f2l()
            elif(cornersb[1] == centrob or cornersb[3] == centrob):
                if(cornersb[3] == centrob):
                    self.rotacion("U'")
                self.rotacion("U'")
                self.f2l()
        elif centrob in cornerst:
            while(True):
                if(self.cubo[0][2][2] == centrob):
                    if(self.cubo[2][0][2] != centrob):
                        self.rotacion("R")
                        self.rotacion("U'")
                        self.rotacion("R'")
                        break
                    else: 
                        if((self.cubo[1][2][2] == self.cubo[1][1][2]) and (self.cubo[5][2][0] == self.cubo[5][1][0])):
                            self.rotacion("d")
                            break
                        else:
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            break
                else:
                    self.rotacion("U")
            self.f2l()
        else:
            if(all(elemento == self.cubo[2][1][1] for elemento in abajo)):
                if(all(elemento == True for elemento in lados)):
                    print("      F2L TERMINADO")
                else:
                    frontald = self.cubo[1][2]
                    frontald = all(e == self.cubo[1][2][1] for e in frontald)
                    atrasd = self.cubo[3][2]
                    atrasd = all(e == self.cubo[3][2][1] for e in atrasd)
                    izqd = self.cubo[4][2]
                    izqd = all(e == self.cubo[4][2][1] for e in izqd)
                    derd = self.cubo[5][2]
                    derd = all(e == self.cubo[5][2][1] for e in derd)
                    ladosd = [frontald, atrasd, izqd, derd]

                    if(all(e == True for e in ladosd)):
                        while(True):
                            if((self.cubo[1][2][2] == self.cubo[1][1][2]) and (self.cubo[5][2][0] == self.cubo[5][1][0])):
                                self.rotacion("d")
                            else: 
                                if(self.cubo[1][0][1] == self.cubo[1][2][2] and (self.cubo[0][2][1] == self.cubo[5][2][0])):
                                    self.rotacion("U")
                                    self.rotacion("R")
                                    self.rotacion("U")
                                    self.rotacion("R'")
                                    self.rotacion("U'")
                                    self.rotacion("F'")
                                    self.rotacion("U'")
                                    self.rotacion("F")
                                    break
                                elif(self.cubo[1][0][1] == self.cubo[5][2][0] and (self.cubo[0][2][1] == self.cubo[1][2][2])):
                                    self.rotacion("d'")
                                    self.rotacion("U'")
                                    self.rotacion("L'")
                                    self.rotacion("U'")
                                    self.rotacion("L")
                                    self.rotacion("U")
                                    self.rotacion("F")
                                    self.rotacion("U")
                                    self.rotacion("F'")
                                    break
                                elif(self.cubo[1][0][1] == self.cubo[1][2][0] and (self.cubo[0][2][1] == self.cubo[4][2][2])):
                                    self.rotacion("U'")
                                    self.rotacion("L'")
                                    self.rotacion("U'")
                                    self.rotacion("L")
                                    self.rotacion("U")
                                    self.rotacion("F")
                                    self.rotacion("U")
                                    self.rotacion("F'")
                                    break
                                elif(self.cubo[1][0][1] == self.cubo[4][2][2] and (self.cubo[0][2][1] == self.cubo[1][2][0])):
                                    self.rotacion("d")
                                    self.rotacion("U")
                                    self.rotacion("R")
                                    self.rotacion("U")
                                    self.rotacion("R'")
                                    self.rotacion("U'")
                                    self.rotacion("F'")
                                    self.rotacion("U'")
                                    self.rotacion("F")
                                    break
                                elif((self.cubo[1][2][2] == self.cubo[4][1][0]) and (self.cubo[5][2][0] == self.cubo[3][1][0])): 
                                    self.rotacion("L")
                                    self.rotacion("U'")
                                    self.rotacion("L'")
                                    self.rotacion("R")
                                    self.rotacion("U")
                                    self.rotacion("R'")
                                    self.rotacion("d'")
                                    break
                                elif((self.cubo[1][2][2] == self.cubo[3][1][0]) and (self.cubo[5][2][0] == self.cubo[4][1][0])):
                                    self.rotacion("L")
                                    self.rotacion("U'")
                                    self.rotacion("L'")
                                    self.rotacion("R")
                                    self.rotacion("U")
                                    self.rotacion("R'")
                                    self.rotacion("d'")
                                    break
                                else: 
                                    self.rotacion("U")
                                    break
                        self.f2l()
                    else:
                        print("788")
                        while(True):
                            if(self.cubo[2][0][2] == centrob):
                                if((self.cubo[1][2][2] == self.cubo[1][1][2]) and (self.cubo[5][2][0] == self.cubo[5][1][0])):
                                    self.rotacion("d")
                                    break
                                else: 
                                    self.rotacion("R")
                                    self.rotacion("U'")
                                    self.rotacion("R'")
                                    break
                            else:
                                self.rotacion("R")
                                self.rotacion("U'")
                                self.rotacion("R'")
                                break
                        self.f2l()
            else:
                while(True):
                    if(self.cubo[2][0][2] == centrob):
                        if((self.cubo[1][2][2] == self.cubo[1][1][2]) and (self.cubo[5][2][0] == self.cubo[5][1][0])):
                            self.rotacion("d")
                            break
                        else: 
                            self.rotacion("R")
                            self.rotacion("U'")
                            self.rotacion("R'")
                            break
                    else:
                        self.rotacion("R")
                        self.rotacion("U'")
                        self.rotacion("R'")
                        break
                self.f2l()
                

    def oll(self):
        centro = self.cubo[0][1][1]
        edges = 0
        #   Numero de Aristas
        if(self.cubo[0][0][1] == centro):
            edges = edges + 1
        if(self.cubo[0][2][1] == centro):
            edges = edges + 1
        if(self.cubo[0][1][0] == centro):
            edges = edges + 1
        if(self.cubo[0][1][2] == centro):
            edges = edges + 1

        if(edges == 0):
            #   F (R U R' U') F' f (R U R' U') f'
            self.rotacion("F")
            self.rotacion("R")
            self.rotacion("U")
            self.rotacion("R'")
            self.rotacion("U'")
            self.rotacion("F'")
            
            self.rotacion("f")
            self.rotacion("R")
            self.rotacion("U")
            self.rotacion("R'")
            self.rotacion("U'")
            self.rotacion("f'")
            
            self.oll()

        elif(edges == 2):
            if((self.cubo[0][1][0] == centro) and (self.cubo[0][1][2] == centro)):
                #   F (R U R' U') F'
                self.rotacion("F")
                self.rotacion("R")
                self.rotacion("U")
                self.rotacion("R'")
                self.rotacion("U'")
                self.rotacion("F'")
                self.oll()
            elif((self.cubo[0][2][1] == centro) and (self.cubo[0][1][2] == centro)):
                #   f (R U R' U') f'
                self.rotacion("f")
                self.rotacion("R")
                self.rotacion("U")
                self.rotacion("R'")
                self.rotacion("U'")
                self.rotacion("f'")
                self.oll()
            else:
                self.rotacion("U")
                self.oll()
            
        elif(edges == 4):
            corners = 0
            #   Numero Top Corners
            if(self.cubo[0][0][0] == centro):
                corners +=  1
            if(self.cubo[0][0][2] == centro):
                corners +=  1
            if(self.cubo[0][2][0] == centro):
                corners +=  1
            if(self.cubo[0][2][2] == centro):
                corners +=  1
            if(corners == 0):
                if((self.cubo[4][0][0] == centro) and (self.cubo[4][0][2]== centro)):
                    if((self.cubo[5][0][0] == centro) and (self.cubo[5][0][2] == centro)):
                        #   (R U R' U) (R U' R' U) (R U2 R')
                        self.rotacion("R")
                        self.rotacion("U")
                        self.rotacion("R'")
                        self.rotacion("U")
                        self.rotacion("R")
                        self.rotacion("U'")
                        self.rotacion("R'")
                        self.rotacion("U")
                        self.rotacion("R")
                        self.rotacion("U2")
                        self.rotacion("R'")
                    elif((self.cubo[1][0][2] == centro) and (self.cubo[3][0][2] == centro)):
                        #   R U2 (R2 U' R2 U' R2) U2 R
                        self.rotacion("R")
                        self.rotacion("U2")
                        self.rotacion("R2")
                        self.rotacion("U'")
                        self.rotacion("R2")
                        self.rotacion("U'")
                        self.rotacion("R2")
                        self.rotacion("U2")
                        self.rotacion("R")
                else:
                    self.rotacion("U")
                self.oll()
            elif(corners == 1):
                if((self.cubo[1][0][2] == centro) and (self.cubo[0][2][0] == centro)):
                    #   (R U R' U) (R U' R' U) (R U2 R')
                    #   (R U R' U) (R U2 R')
                    self.rotacion("R")
                    self.rotacion("U")
                    self.rotacion("R'")
                    self.rotacion("U")
                    self.rotacion("R")
                    self.rotacion("U2")
                    self.rotacion("R'")
                elif((self.cubo[1][0][0] == centro) and (self.cubo[0][2][2] == centro)):
                    #   R U2 (R2 U' R2 U' R2) U2 R
                    self.rotacion("R")
                    self.rotacion("U2")
                    self.rotacion("R2")
                    self.rotacion("U'")
                    self.rotacion("R2")
                    self.rotacion("U'")
                    self.rotacion("R2")
                    self.rotacion("U2")
                    self.rotacion("R")
                else:
                    self.rotacion("U")
                self.oll()
            elif(corners == 2):
                if((self.cubo[0][2][0] != centro) and (self.cubo[1][0][0] == centro)):
                    if(self.cubo[0][0][0] != centro):
                        #   (r U R' U') (r' F R F')
                        self.rotacion("r")
                        self.rotacion("U")
                        self.rotacion("R'")
                        self.rotacion("U'")
                        self.rotacion("r'")
                        self.rotacion("F")
                        self.rotacion("R")
                        self.rotacion("F'")
                    elif(self.cubo[0][0][2] != centro):
                        #   (F R' F' r) (U R U' r')
                        self.rotacion("F")
                        self.rotacion("R'")
                        self.rotacion("F'")
                        self.rotacion("r")
                        self.rotacion("U")
                        self.rotacion("R")
                        self.rotacion("U'")
                        self.rotacion("r'")
                    elif(self.cubo[0][2][2] != centro):
                        #   R2 D (R' U2 R) D' (R' U2 R')
                        self.rotacion("R2")
                        self.rotacion("D")
                        self.rotacion("R'")
                        self.rotacion("U2")
                        self.rotacion("R")
                        self.rotacion("D'")
                        self.rotacion("R'")
                        self.rotacion("U2")
                        self.rotacion("R'")
                else:
                    self.rotacion("U")
                    self.oll()


    def pll(self):
        cornersf = [self.cubo[1][0][0], self.cubo[1][0][2]]
        cornersb = [self.cubo[3][0][0], self.cubo[3][0][2]]
        cornersl = [self.cubo[4][0][0], self.cubo[4][0][2]]
        cornersr = [self.cubo[5][0][0], self.cubo[5][0][2]]

        cfronti = all(elemento == cornersf[0] for elemento in cornersf)    # 0
        cbacki = all(elemento == cornersb[0] for elemento in cornersb)     # 1
        clefti = all(elemento == cornersl[0] for elemento in cornersl)     # 2
        crighti = all(elemento == cornersr[0] for elemento in cornersr)    # 3
        
        cvars = [cfronti, cbacki, clefti, crighti]
        cvari = all(elemento == True for elemento in cvars)
        if(cvari):
            front, back, left, right = [], [], [], []
            
            for i in range(3):
                if(self.cubo[1][0][i]):
                    front.append(self.cubo[1][0][i])
                if(self.cubo[3][0][i]):
                    back.append(self.cubo[3][0][i])
                if(self.cubo[4][0][i]):
                    left.append(self.cubo[4][0][i])
                if(self.cubo[5][0][i]):
                    right.append(self.cubo[5][0][i])

            fronti = all(elemento == front[0] for elemento in front)    # 0
            backi = all(elemento == back[0] for elemento in back)       # 1
            lefti = all(elemento == left[0] for elemento in left)       # 2
            righti = all(elemento == right[0] for elemento in right)    # 3
            
            vars = [fronti, backi, lefti, righti]
            vari = all(elemento == True for elemento in vars)
            if(vari):
                if(front[0] != self.cubo[1][1][1]):
                    self.rotacion("U")
                    self.pll()
                else:
                    #print()
                    print("        COMPLETADO")
                    #print()
            else:
                if(fronti or backi or lefti or righti):
                    for i, valor in enumerate(vars):
                        if valor:
                            if (i == 0):
                                self.rotacion("U2")
                            if (i == 2):
                                self.rotacion("U")
                            if (i == 3):
                                self.rotacion("U'")
                            break
                    if((self.cubo[4][0][0] == self.cubo[5][0][1]) and (self.cubo[4][0][2] == self.cubo[5][0][1])):
                        if((self.cubo[5][0][0] == self.cubo[4][0][1]) and (self.cubo[5][0][2] == self.cubo[4][0][1])):
                            #   M2 U M2 U2 M2 U M2
                            self.rotacion("M2")
                            self.rotacion("U")
                            self.rotacion("M2")
                            self.rotacion("U2")
                            self.rotacion("M2")
                            self.rotacion("U")
                            self.rotacion("M2")
                        else:
                            #   M2 U M U2 M' U M2
                            self.rotacion("M2")
                            self.rotacion("U")
                            self.rotacion("M")
                            self.rotacion("U2")
                            self.rotacion("M'")
                            self.rotacion("U")
                            self.rotacion("M2")

                    elif((self.cubo[5][0][0] == self.cubo[4][0][1]) and (self.cubo[5][0][2] == self.cubo[4][0][1])):
                        #   M2 U' M U2 M' U' M2
                        self.rotacion("M2")
                        self.rotacion("U'")
                        self.rotacion("M")
                        self.rotacion("U2")
                        self.rotacion("M'")
                        self.rotacion("U'")
                        self.rotacion("M2")
                    
                    self.pll()
                else:  
                    if(front[0] != self.cubo[1][1][1]):
                        self.rotacion("U")
                        self.pll()
                    else:
                        if(front[1] == back[0] and left[1] == right[0]):
                            #   M2 U M2 U2 M2 U M2
                            self.rotacion("M2")
                            self.rotacion("U")
                            self.rotacion("M2")
                            self.rotacion("U2")
                            self.rotacion("M2")
                            self.rotacion("U")
                            self.rotacion("M2")
                        else:
                            self.rotacion("U")
                            #   M' U (M2 U M2 U) M' U2 M2
                            self.rotacion("M'")
                            self.rotacion("U")
                            self.rotacion("M2")
                            self.rotacion("U")
                            self.rotacion("M2")
                            self.rotacion("U")
                            self.rotacion("M'")
                            self.rotacion("U2")
                            self.rotacion("M2")
                        self.pll()
        else:
            if((cornersf[0] == cornersf[1]) or (cornersb[0] == cornersb[1]) or (cornersl[0] == cornersl[1]) or (cornersr[0] == cornersr[1])):
                if(cornersl[0] == cornersl[1]):
                    #   (R U R' U') R' F (R2 U' R' U') (R U R') F'
                    self.rotacion("R")
                    self.rotacion("U")
                    self.rotacion("R'")
                    self.rotacion("U'")
                    self.rotacion("R'")
                    self.rotacion("F")
                    self.rotacion("R2")
                    self.rotacion("U'")
                    self.rotacion("R'")
                    self.rotacion("U'")
                    self.rotacion("R")
                    self.rotacion("U")
                    self.rotacion("R'")
                    self.rotacion("F'")
                else:
                    self.rotacion("U")
                self.pll()
            elif((cornersf[0] == self.cubo[1][1][1] and cornersl[1] == self.cubo[4][1][1]) and (cornersb[1] == self.cubo[3][1][1] and cornersr[1] == self.cubo[5][1][1])):
                #   F (R U' R' U') (R U R') F' (R U R' U') (R' F R F')
                self.rotacion("F")
                self.rotacion("R")
                self.rotacion("U'")
                self.rotacion("R'")
                self.rotacion("U'")
                self.rotacion("R")
                self.rotacion("U")
                self.rotacion("R'")
                self.rotacion("F'")
                self.rotacion("R")
                self.rotacion("U")
                self.rotacion("R'")
                self.rotacion("U'")
                self.rotacion("R'")
                self.rotacion("F")
                self.rotacion("R")
                self.rotacion("F'")
                self.pll()
            else:
                self.rotacion("U")
                self.pll()


    def mostrar_cubo(self):
        for fila in range(3):
            print("          ", end="")
            for cara in range(3):
                printi(self.cubo[0][fila][cara])
            print("    ", end="")
            for cara in range(3):
                printi(self.cubo[3][fila][cara])
            print()

        for fila in range(3):
            print("   ", end="")
            for cara in range(3):
                printi(self.cubo[4][fila][cara])
            print(" ", end="")
            for cara in range(3):
                printi(self.cubo[1][fila][cara])
            print(" ", end="")
            for cara in range(3):
                printi(self.cubo[5][fila][cara])
            print()

        for fila in range(3):
            print("          ", end="")
            for cara in range(3):
                printi(self.cubo[2][fila][cara])
            print()
