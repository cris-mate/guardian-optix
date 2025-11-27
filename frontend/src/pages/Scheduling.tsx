import React, { useState, useEffect } from 'react';
import { createSchedule, fetchSchedules } from "@/utils/api";

interface Schedule {
  _id: string;
  employeeName: string;
  role: string;
  jobName: string;
  location: string;
  shiftTime: string;
}

const Scheduling: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employeeName, setEmployeeName] = useState('');
  const [role, setRole] = useState('Static');
  const [jobName, setJobName] = useState('');
  const [location, setLocation] = useState('');
  const [shiftTime, setShiftTime] = useState('Morning');
  const [error, setError] = useState('');

  const loadSchedules = async () => {
    try {
      const data = await fetchSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Failed to load schedules.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSchedule = await createSchedule(employeeName, role, jobName, location, shiftTime );
      setSchedules((prevSchedules) => [...prevSchedules, newSchedule]); // Directly update the state

      // Clear input fields after creation
      setEmployeeName('');
      setRole('Static');
      setJobName('');
      setLocation('');
      setShiftTime('Morning');
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError('Failed to create schedule.');
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, []);

  return (
    <div className="public-card" style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'left'}} >
      <header className="public-header">
        <h2>Employee Scheduling</h2>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} className="public-form">
        <div className="public-form-group">
          <label htmlFor="employeeName">Employee Name</label>
          <input
            id="employeeName"
            type="text"
            className="public-form-input"
            placeholder="Employee Name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            required={true}
          />
        </div>

        <div className="public-form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            className="public-form-input"
            aria-placeholder="Static"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required={true}
          >
            <option value="Static">Static</option>
            <option value="Dog Handler">Dog Handler</option>
            <option value="Close Protection">Close Protection</option>
            <option value="Mobile Patrol">Mobile Patrol</option>
          </select>
        </div>

        <div className="public-form-group">
          <label htmlFor="jobName">Job</label>
          <input
            id="jobName"
            type="text"
            className="public-form-input"
            placeholder="Job"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            required={true}
          />
        </div>

        <div className="public-form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            className="public-form-input"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required={true}
          />
        </div>

        <div className="public-form-group">
          <label htmlFor="shift">Shift</label>
          <select
            id="shift"
            name="shift"
            className="public-form-input"
            value={shiftTime}
            onChange={(e) => setShiftTime(e.target.value)}
            required={true}
          >
            <option value="Morning">Morning (06:00 - 14:00)</option>
            <option value="Afternoon">Afternoon (14:00 - 22:00)</option>
            <option value="Night">Night (22:00 - 06:00)</option>
          </select>
        </div>

        <div className="public-button-container">
          <button type="submit" className="public-button public-button--primary">Create Schedule</button>
        </div>
      </form>

      <h3 style={{ marginTop: '2rem' }}>Current Schedules</h3>
      <ul>
        {schedules.map((schedule) => (
          <li key={schedule._id}>
            {schedule.employeeName} - Role: {schedule.role} - Job: {schedule.jobName} - Shift: {schedule.shiftTime}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scheduling;
