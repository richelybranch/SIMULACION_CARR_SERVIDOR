const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Ruta del archivo de datos
const filePath = path.join(__dirname, 'carreras.json');

// Función para leer datos
const readData = () => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error('Error al leer el archivo:', error);
        return [];
    }
};

// Función para escribir datos
const writeData = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir en el archivo:', error);
    }
};

// Crear corredores con velocidad aleatoria
const generarCorredores = (numeroCorredores) => {
    return Array.from({ length: numeroCorredores }, (_, i) => ({
        id: i + 1,
        velocidad: Math.floor(Math.random() * 15) + 5, // Velocidad entre 5 y 20 km/h
        progreso: 0
    }));
};

// Simular carrera
const simularCarrera = (corredores, distancia) => {
    let ganador = null;
    let horas = 0;

    while (!ganador) {
        horas++;
        corredores.forEach((corredor) => {
            corredor.progreso += corredor.velocidad;
            if (corredor.progreso >= distancia && !ganador) {
                ganador = corredor;
            }
        });
    }

    return { ganador, horas };
};

// **RUTAS**
// Obtener todas las carreras
app.get('/compe', (req, res) => {
    const carreras = readData();
    res.json(carreras);
});

// Crear una nueva carrera
app.post('/compe', (req, res) => {
    const carreras = readData();
    const { numeroCorredores, distancia } = req.body;

    if (!numeroCorredores || !distancia) {
        return res.status(400).json({ mensaje: 'Faltan datos: número de corredores y distancia son requeridos' });
    }

    const corredores = generarCorredores(numeroCorredores);
    const { ganador, horas } = simularCarrera(corredores, distancia);

    const nuevaCarrera = {
        id: carreras.length > 0 ? carreras[carreras.length - 1].id + 1 : 1,
        numeroCorredores,
        distancia,
        corredores,
        ganador: { id: ganador.id, velocidad: ganador.velocidad },
        horas
    };

    carreras.push(nuevaCarrera);
    writeData(carreras);
    res.status(201).json(nuevaCarrera);
});



// Obtener una carrera por ID
app.get('/compe/:id', (req, res) => {
    const carreras = readData();
    const id = parseInt(req.params.id);

    const carrera = carreras.find((c) => c.id === id);
    if (!carrera) {
        return res.status(404).json({ mensaje: 'Carrera no encontrada' });
    }

    res.json(carrera);
});

// Actualizar una carrera
app.put('/compe/:id', (req, res) => {
    const carreras = readData();
    const id = parseInt(req.params.id);
    const { numeroCorredores, distancia } = req.body;

    const carrera = carreras.find((c) => c.id === id);
    if (!carrera) {
        return res.status(404).json({ mensaje: 'Carrera no encontrada' });
    }

    if (numeroCorredores || distancia) {
        carrera.numeroCorredores = numeroCorredores || carrera.numeroCorredores;
        carrera.distancia = distancia || carrera.distancia;
        carrera.corredores = generarCorredores(carrera.numeroCorredores);
        const { ganador, horas } = simularCarrera(carrera.corredores, carrera.distancia);
        carrera.ganador = { id: ganador.id, velocidad: ganador.velocidad };
        carrera.horas = horas;
    }

    writeData(carreras);
    res.json(carrera);
});



// Eliminar una carrera
app.delete('/compe/:id', (req, res) => {
    const carreras = readData();
    const id = parseInt(req.params.id);

    const nuevasCarreras = carreras.filter((carrera) => carrera.id !== id);
    if (nuevasCarreras.length === carreras.length) {
        return res.status(404).json({ mensaje: 'Carrera no encontrada' });
    }

    writeData(nuevasCarreras);
    res.json({ mensaje: 'Carrera eliminada correctamente' });
});

// Manejo de rutas no definidas
app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
