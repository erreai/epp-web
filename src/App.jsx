import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { utils, writeFile } from 'xlsx';
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap/dist/js/bootstrap.bundle.min";
import './App.css'; // Asegúrate de importar el archivo CSS

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
      <td>{index + 1}</td>
      <td><input type="text" value={participant.name} onChange={(e) => updateParticipant(index, 'name', e.target.value, true)} /></td>
      <td onClick={handleStart}>
        {participant.startTime ? new Date(participant.startTime).toLocaleTimeString() : <button className='btn btn-sm btn-primary'>Iniciar</button>}
      </td>
      <td onClick={handleAlarm}>{participant.alarmTime ? new Date(participant.alarmTime).toLocaleTimeString() : <button className='btn btn-sm btn-outline-secondary'>Marcar Alarma</button>}</td>
      <td onClick={handleEnd}>{participant.endTime ? new Date(participant.endTime).toLocaleTimeString() : <button className='btn btn-sm btn-outline-secondary'>Marcar Término</button>}</td>
      <td>{formatTime(totalTime)}</td>
      <td>{formatTime(workTime)}</td>
      <td>{formatTime(halfWorkTime)}</td>
      <td><input type="text" value={participant.observations} onChange={(e) => updateParticipant(index, 'observations', e.target.value, true)} /></td>
    </tr>
  );
};

const App = () => {
  const [participants, setParticipants] = useState(Array(24).fill().map(() => ({
    name: '',
    startTime: null,
    alarmTime: null,
    endTime: null,
    elapsedTime: 0,
    observations: ''
  })));
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('Tabla de Participantes', 10, 10);
    
    // Add table headers
    doc.text('N°', 10, 20);
    doc.text('Nombre', 30, 20);
    doc.text('Tiempo de partida', 70, 20);
    doc.text('Alarma', 120, 20);
    doc.text('Término', 170, 20);
    doc.text('Tiempo total', 220, 20);
    doc.text('Inicio-Alarma', 270, 20);
    doc.text('Tiempo de Trabajo', 320, 20);
    doc.text('Observaciones', 370, 20);

    let y = 30;
    participants.forEach((participant, index) => {
      const workTime = participant.alarmTime ? (participant.alarmTime - participant.startTime) : 0;
      const halfWorkTime = workTime / 2;
      const totalTime = participant.endTime ? (participant.endTime - participant.startTime) : 0;

      doc.text(`${index + 1}`, 10, y);
      doc.text(participant.name, 30, y);
      doc.text(participant.startTime ? new Date(participant.startTime).toLocaleTimeString() : '', 70, y);
      doc.text(participant.alarmTime ? new Date(participant.alarmTime).toLocaleTimeString() : '', 120, y);
      doc.text(participant.endTime ? new Date(participant.endTime).toLocaleTimeString() : '', 170, y);
      doc.text(formatTime(totalTime), 220, y);
      doc.text(formatTime(workTime), 270, y);
      doc.text(formatTime(halfWorkTime), 320, y);
      doc.text(participant.observations, 370, y);
      y += 10;
    });

    doc.save('tabla.pdf');
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
    writeFile(workbook, 'participantes.xlsx');
  };

  return (
    <div className="main-container">
      <button className="btn btn-sm btn-light btn-corner" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-braces-asterisk" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M1.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C2.25 2 1.49 2.759 1.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6M14.886 7.9v.164c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456v-1.3c-1.114 0-1.49-.362-1.49-1.456V4.352C14.51 2.759 13.75 2 12.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6M7.5 11.5V9.207l-1.621 1.621-.707-.707L6.792 8.5H4.5v-1h2.293L5.172 5.879l.707-.707L7.5 6.792V4.5h1v2.293l1.621-1.621.707.707L9.208 7.5H11.5v1H9.207l1.621 1.621-.707.707L8.5 9.208V11.5z"/>
      </svg>
      </button>
      <div className="header d-flex flex-row justify-content-evenly align-items-center">
        <h1>Control Test de Consumo</h1>
        <h2>Hora actual: {currentTime.toLocaleTimeString()}</h2>
      </div>
      <div className="table-responsive">
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>N°</th>
              <th>Nombre</th>
              <th>Tiempo de partida</th>
              <th>Alarma</th>
              <th>Término</th>
              <th>Tiempo total</th>
              <th>Inicio-Alarma</th>
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
      <div className="d-flex flex-row justify-content-evenly">
        <button className='btn btn-success' onClick={exportPDF}>Exportar a PDF</button>
        <button className='btn btn-success' onClick={exportExcel}>Exportar a Excel</button>
      </div>
      <div className="footer mt-3 me-2">
        <p className="text-end">Basado en el Control Test de Consumo de <a href='https://www.instagram.com/fundacionblancamarisol' target='_blank' rel="noreferrer">Claudio Gonzalez Morales</a>, Cuerpo de Bomberos de Codegua</p>
      </div>

      
      <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Esta WebApp fue creada por Raimundo Concha Corti, Instructor ANB. Cuerpo de Bomberos de Ñuñoa. 2024</p>
            <p>Repo: <a href='https://github.com/erreai/epp-web'>https://github.com/erreai/epp-web</a></p>

          </div>
        </div>
      </div>
      </div>

    </div>
  );
};

export default App;
