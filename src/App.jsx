/*
 * Este archivo es parte de WebApp Control Test de Consumo.
 *
 * WebApp Control Test de Consumo es software gratuito: puedes redistribuirlo y/o modificarlo
 * bajo los términos de la Licencia Pública General GNU publicada por
 * la Free Software Foundation, ya sea la versión 3 de la Licencia, o
 * cualquier versión posterior.
 *
 * WebApp Control Test de Consumo se distribuye con la esperanza de que sea útil,
 * pero SIN NINGUNA GARANTÍA; sin siquiera la garantía implícita de
 * COMERCIABILIDAD o IDONEIDAD PARA UN PROPÓSITO PARTICULAR. Ver el
 * Licencia Pública General GNU para más detalles.
 *
 * Deberías haber recibido una copia de la Licencia Pública General GNU
 * junto con WebApp Control Test de Consumo. En caso contrario, consulte <https://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { utils, writeFile } from 'xlsx';
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap/dist/js/bootstrap.bundle.min";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import './App.css'; // Asegúrate de importar el archivo CSS
import logo from './logo.png';

// Función para formatear el tiempo en HH:MM:SS
const formatTime = (ms) => {
  if (ms === null || ms === undefined) return '';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const ParticipantRow = ({ participant, index, updateParticipant }) => {
  useEffect(() => {
    let timer;
    if (participant.startTime && !participant.endTime) {
      timer = setInterval(() => {
        updateParticipant(index, 'elapsedTime', Date.now() - participant.startTime, false);
      }, 1000);
    } else if (participant.endTime) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [participant.startTime, participant.endTime, index, updateParticipant]);

  const handleStart = () => {
    if (!participant.startTime) {
      updateParticipant(index, 'startTime', Date.now(), true);
    }
  };

  const handleAlarm = () => {
    if (participant.startTime && !participant.alarmTime) {
      updateParticipant(index, 'alarmTime', Date.now(), true);
    }
  };

  const handleEnd = () => {
    if (participant.startTime && !participant.endTime) {
      const endTime = Date.now();
      updateParticipant(index, 'endTime', endTime, true);
      if (!participant.alarmTime) {
        updateParticipant(index, 'alarmTime', endTime, true);
      }
    }
  };

  const workTime = participant.alarmTime ? (participant.alarmTime - participant.startTime) : 0;
  const halfWorkTime = workTime / 2;
  const totalTime = participant.endTime ? (participant.endTime - participant.startTime) : 0;

  return (
    <tr>
      <td data-label="N°">{index + 1}</td>
      <td data-icon="bi bi-chat-left-dots" data-label="Nombre"><input type="text" value={participant.name} onChange={(e) => updateParticipant(index, 'name', e.target.value, true)} /></td>
      <td data-icon="d-sm-none bi bi-play-circle" data-label="Partida"  onClick={handleStart}>
        {participant.startTime ? new Date(participant.startTime).toLocaleTimeString() : <button className='btn btn-sm btn-primary'>Iniciar</button>}
      </td>
      <td data-icon="d-sm-none bi bi-bell" data-label="Alarma" onClick={handleAlarm}>{participant.alarmTime ? new Date(participant.alarmTime).toLocaleTimeString() : <button className='btn btn-sm btn-outline-secondary'>Marcar Alarma</button>}</td>
      <td data-icon="d-sm-none bi bi-stop-circle" data-label="Término" onClick={handleEnd}>{participant.endTime ? new Date(participant.endTime).toLocaleTimeString() : <button className='btn btn-sm btn-outline-secondary'>Marcar Término</button>}</td>
      <td data-icon="d-sm-none bi bi-stopwatch" data-label="Total">{formatTime(totalTime)}</td>
      <td data-icon="d-sm-none bi bi-alarm" data-label="Inicio-Alarma">{formatTime(workTime)}</td>
      <td data-icon="d-sm-none bi bi-plus-slash-minus" data-label="Trabajo" >{formatTime(halfWorkTime)}</td>
      <td data-icon="bi bi-pencil-square" data-label="Obs."><input type="text" value={participant.observations} onChange={(e) => updateParticipant(index, 'observations', e.target.value, true)} /></td>
    </tr>
  );
};

const App = () => {
  const initialParticipants = Array(16).fill().map(() => ({
    name: '',
    startTime: null,
    alarmTime: null,
    endTime: null,
    elapsedTime: 0,
    observations: ''
  }));

  const [participants, setParticipants] = useState(initialParticipants);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [protectionLevel, setProtectionLevel] = useState('D');
  const [eraType, setEraType] = useState('Circuito Abierto');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateParticipant = (index, key, value, shouldUpdate) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [key]: value };
    if (shouldUpdate) {
      setParticipants(newParticipants);
    } else {
      setParticipants(prev => {
        const updatedParticipants = [...prev];
        updatedParticipants[index] = { ...updatedParticipants[index], [key]: value };
        return updatedParticipants;
      });
    }
  };
  const addParticipant = () => {
    if (participants.length < 40) {
      setParticipants([...participants, {
        name: '',
        startTime: null,
        alarmTime: null,
        endTime: null,
        elapsedTime: 0,
        observations: ''
      }]);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    const img = new Image();
    img.src = logo;
    doc.addImage(img, 'PNG', 270, 5, 22, 25);


    // Define el tamaño y estilo de la fuente
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString();
    doc.text(`Fecha: ${date}`, 10, 10);
    doc.text(`Nivel de Protección: ${protectionLevel}`, 100, 10);
    doc.text(`Tipo de ERA: ${eraType}`, 150, 10);
    doc.setFontSize(20);
    doc.text('Tabla de Participantes', 10, 20);
    doc.setFontSize(10);
    // Ajusta el tamaño de la letra y la distancia entre columnas
    const startX = 5;
    const startY = 30;
    const columnWidth = 30;

    // Añade las cabeceras de la tabla
    doc.text('Nombre', startX, startY);
    doc.text('Partida', startX + 2 * columnWidth, startY);
    doc.text('Alarma', startX + 2.8 * columnWidth, startY);
    doc.text('Término', startX + 3.5 * columnWidth, startY);
    doc.text('Tiempo total', startX + 4.2 * columnWidth, startY);
    doc.text('Inicio-Alarma', startX + 5 * columnWidth, startY);
    doc.text('T. de Trabajo', startX + 5.8 * columnWidth, startY);
    doc.text('Observaciones', startX + 6.7 * columnWidth, startY);

    let y = startY + 10;
    participants.forEach((participant, index) => {
      if (index === 17) {
        doc.addPage();
        y = 15;
      }
      const workTime = participant.alarmTime ? (participant.alarmTime - participant.startTime) : 0;
      const halfWorkTime = workTime / 2;
      const totalTime = participant.endTime ? (participant.endTime - participant.startTime) : 0;

      doc.text(`${`${index + 1} ` + participant.name}`, startX, y);
      doc.text(participant.startTime ? new Date(participant.startTime).toLocaleTimeString() : '', startX + 2 * columnWidth, y);
      doc.text(participant.alarmTime ? new Date(participant.alarmTime).toLocaleTimeString() : '', startX + 2.8 * columnWidth, y);
      doc.text(participant.endTime ? new Date(participant.endTime).toLocaleTimeString() : '', startX + 3.5 * columnWidth, y);
      doc.text(formatTime(totalTime), startX + 4.2 * columnWidth, y);
      doc.text(formatTime(workTime), startX + 5 * columnWidth, y);
      doc.text(formatTime(halfWorkTime), startX + 5.8 * columnWidth, y);
      doc.text(participant.observations, startX + 6.7 * columnWidth, y);
      y += 10;
    });
    const fileName = `test_consumo_${new Date().getDate()}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`;
    doc.save(fileName);
  };

  const exportExcel = () => {
    const data = participants.map((participant, index) => ({
      'N°': index + 1,
      'Nombre': participant.name,
      'Tiempo de partida': participant.startTime ? new Date(participant.startTime).toLocaleTimeString() : '',
      'Alarma': participant.alarmTime ? new Date(participant.alarmTime).toLocaleTimeString() : '',
      'Término': participant.endTime ? new Date(participant.endTime).toLocaleTimeString() : '',
      'Tiempo total': formatTime(participant.endTime ? (participant.endTime - participant.startTime) : 0),
      'Tiempo de Trabajo': formatTime(participant.alarmTime ? (participant.alarmTime - participant.startTime) : 0),
      'Tiempo de Trabajo / 2': formatTime((participant.alarmTime ? (participant.alarmTime - participant.startTime) : 0) / 2),
      'Observaciones': participant.observations,
    }));

    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Participantes');
    const configSheet = utils.aoa_to_sheet([
      ['Fecha', new Date().toLocaleDateString()],
      ['Nivel de Protección', protectionLevel],
      ['Tipo de ERA', eraType],
    ]);
    utils.book_append_sheet(workbook, configSheet, 'Configuración');
    const fileName = `test_consumo_${new Date().getDate()}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`;
    writeFile(workbook, fileName);
  };

  return (
    <div className="main-container">
      <button id='developerModal' className="btn btn-sm btn-light btn-corner" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
        <i className='bi bi-braces-asterisk'></i>
      </button>
      <div className="header d-flex flex-row justify-content-evenly align-items-center">
        <h1>Control Test de Consumo</h1>
        <h2>Hora actual: {currentTime.toLocaleTimeString()}</h2>
      </div>
      <div className="className">
        <button id='configCollapse' className="btn btn-sm btn-secondary btn-config" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
          <i className='bi bi-gear-wide-connected'></i>
        </button>
        <div className='collapse' id='collapseExample'>
          <div className='card card-body'>
            <div className='config-section'>
              <h3>Configuración General del Ejercicio</h3>
              <div className='d-flex flex-row'>
                <label className='label-bold label'>Nivel de Protección:</label>
                <div className='options'>
                  <label><input id="eppA" type="radio" value="A" checked={protectionLevel === 'A'} onChange={() => setProtectionLevel('A')} /> A</label>
                  <label><input id="eppB" type="radio" value="B" checked={protectionLevel === 'B'} onChange={() => setProtectionLevel('B')} /> B</label>
                  <label><input id="eppC" type="radio" value="C" checked={protectionLevel === 'C'} onChange={() => setProtectionLevel('C')} /> C</label>
                  <label><input id="eppD" type="radio" value="D" checked={protectionLevel === 'D'} onChange={() => setProtectionLevel('D')} /> D</label>
                </div>
              </div>
              <div className='d-flex flex-row'>
                <label className='label-bold label'>Tipo de ERA:</label>
                <div className='options'>
                  <label><input id="eraAbierto" type="radio" value="Circuito Abierto" checked={eraType === 'Circuito Abierto'} onChange={() => setEraType('Circuito Abierto')} /> Circuito Abierto</label>
                  <label><input id="eraCerrado" type="radio" value="Circuito Cerrado" checked={eraType === 'Circuito Cerrado'} onChange={() => setEraType('Circuito Cerrado')} /> Circuito Cerrado</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className='table table-striped'>
          <thead className='hide-sm'>
            <tr>
              <th>N°</th>
              <th>Nombre</th>
              <th>Tiempo de partida</th>
              <th>Alarma </th>
              <th>Término</th>
              <th>Tiempo total</th>
              <th>Inicio-Alarma </th>
              <th>Tiempo de Trabajo</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, index) => (
              <ParticipantRow key={index} index={index} participant={participant} updateParticipant={updateParticipant} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1 ms-2">
        {participants.length < 40 && (
          <button id='addParticipant' className='btn btn-sm btn-primary' onClick={addParticipant}>Agregar Participante</button>
        )}
      </div>
      <div className="d-flex flex-row justify-content-evenly mt-3 ms-2">
        <button id="exportPDF" className='btn btn-success' onClick={exportPDF}>Exportar a PDF</button>
        <button id='exportXLSX' className='btn btn-success' onClick={exportExcel}>Exportar a Excel</button>
      </div>
      <div className="footer mt-3 pe-2">
        <p className="text-end mb-0">Licencia <a href="https://www.gnu.org/licenses/gpl-3.0.html">GPLv3</a>. Bomberos de Chile</p>
      </div>

      
      <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Esta WebApp fue creada por Raimundo Concha Corti, Instructor ANB. <a href='https://www.bomba2.cl' target='_blank' rel='noreferrer'>Segunda Compañía</a> Cuerpo de Bomberos de Ñuñoa.</p>
            <p>Basado en el Control Test de Consumo de <a href='https://www.instagram.com/fundacionblancamarisol' target='_blank' rel='noreferrer'>Claudio Gonzalez Morales</a>, Cuerpo de Bomberos de Codegua.</p>
            <p>Repo: <a href='https://github.com/erreai/epp-web'>https://github.com/erreai/epp-web</a></p>
            <p>2024</p>
          </div>
        </div>
      </div>
      </div>

    </div>
  );
};

export default App;
