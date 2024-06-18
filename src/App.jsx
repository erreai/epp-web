import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';

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
  }, [participant.startTime, participant.endTime]);

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
      <td><input type="text" value={participant.name} onChange={(e) => updateParticipant(index, 'name', e.target.value, true)} /></td>
      <td onClick={handleStart}>{participant.startTime ? new Date(participant.startTime).toLocaleTimeString() : 'Iniciar'}</td>
      <td onClick={handleAlarm}>{participant.alarmTime ? new Date(participant.alarmTime).toLocaleTimeString() : ''}</td>
      <td onClick={handleEnd}>{participant.endTime ? new Date(participant.endTime).toLocaleTimeString() : ''}</td>
      <td>{formatTime(totalTime)}</td>
      <td>{formatTime(workTime)}</td>
      <td>{formatTime(halfWorkTime)}</td>
    </tr>
  );
};

const App = () => {
  const [participants, setParticipants] = useState(Array(24).fill().map(() => ({
    name: '',
    startTime: null,
    alarmTime: null,
    endTime: null,
    elapsedTime: 0
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
    doc.text('Nombre', 10, 20);
    doc.text('Tiempo de partida', 50, 20);
    doc.text('Alarma', 100, 20);
    doc.text('Término', 150, 20);
    doc.text('Tiempo total', 200, 20);
    doc.text('Tiempo de Trabajo', 250, 20);
    doc.text('Tiempo de Trabajo / 2', 300, 20);

    let y = 30;
    participants.forEach((participant, index) => {
      const workTime = participant.alarmTime ? (participant.alarmTime - participant.startTime) : 0;
      const halfWorkTime = workTime / 2;
      const totalTime = participant.endTime ? (participant.endTime - participant.startTime) : 0;

      doc.text(`${index + 1}. ${participant.name}`, 10, y);
      doc.text(participant.startTime ? new Date(participant.startTime).toLocaleTimeString() : '', 50, y);
      doc.text(participant.alarmTime ? new Date(participant.alarmTime).toLocaleTimeString() : '', 100, y);
      doc.text(participant.endTime ? new Date(participant.endTime).toLocaleTimeString() : '', 150, y);
      doc.text(formatTime(totalTime), 200, y);
      doc.text(formatTime(workTime), 250, y);
      doc.text(formatTime(halfWorkTime), 300, y);
      y += 10;
    });

    doc.save('tabla.pdf');
  };

  return (
    <div>
      <h1>Participantes</h1>
      <h2>Hora actual: {currentTime.toLocaleTimeString()}</h2>
      <button onClick={exportPDF}>Exportar a PDF</button>
      <table border="1">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tiempo de partida</th>
            <th>Alarma</th>
            <th>Término</th>
            <th>Tiempo total</th>
            <th>Inicio - Alarma</th>
            <th>Tiempo de Trabajo</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, index) => (
            <ParticipantRow key={index} index={index} participant={participant} updateParticipant={updateParticipant} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
