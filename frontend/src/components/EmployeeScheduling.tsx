import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Schedule {
  _id: string;
  employeeName: string;
  shiftTime: string;
  role: string;
}

const EmployeeScheduling: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employeeName, setEmployeeName] = useState('');
  const [shiftTime, setShiftTime] = useState('');
  const [role, setRole] = useState('');

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const createSchedule = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/schedules', { employeeName, shiftTime, role });
      setSchedules((prevSchedules) => [...prevSchedules, response.data]); // Directly update the state
      setEmployeeName(''); // Clear input fields
      setShiftTime('');
      setRole('');
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div>
      <h2>Employee Scheduling</h2>
      <input
        type="text"
        placeholder="Employee Name"
        value={employeeName}
        onChange={(e) => setEmployeeName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Shift Time"
        value={shiftTime}
        onChange={(e) => setShiftTime(e.target.value)}
      />
      <input
        type="text"
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <button onClick={createSchedule}>Create Schedule</button>

      <h3>Schedule List</h3>
      <ul>
        {schedules.map((schedule) => (
          <li key={schedule._id}>
            {schedule.employeeName} - Shift: {schedule.shiftTime} - Role: {schedule.role}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmployeeScheduling;
