import re

def validar_cuil_cuit(cuil: str) -> bool:
    if not re.fullmatch(r"\d{11}", cuil):
        return False

    numeros = [int(d) for d in cuil]
    coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

    suma = sum([a * b for a, b in zip(numeros[:10], coeficientes)])
    resto = suma % 11
    digito_verificador = 11 - resto

    if digito_verificador == 11:
        digito_verificador = 0
    elif digito_verificador == 10:
        digito_verificador = 9

    return numeros[10] == digito_verificador