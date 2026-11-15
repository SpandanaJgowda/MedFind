import React, { useState } from 'react';
import { User, Phone, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import Alert from '../../components/common/Alert';
import './PatientDashboard.css';

export default function PatientProfilePage() {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);
  const [passError, setPassError] = useState(null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await authService.updateProfile(profileData);
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileMsg('Personal details updated successfully.');
      }
    } catch (err) {
      setProfileMsg('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassMsg(null);

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await authService.changePassword(passwords);
      if (res.data.success) {
        setPassMsg('Password changed successfully.');
        setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      } else {
        setPassError(res.data.message || 'Failed to change password.');
      }
    } catch (err) {
      setPassError(err.response?.data?.message || 'Current password incorrect.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '780px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          Patient Profile Settings
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
          Manage your contact information and security preferences.
        </p>
      </div>

      {/* Edit Profile Card */}
      <div className="card" style={{ padding: '30px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          Personal Information
        </h3>

        {profileMsg && <Alert type="success" message={profileMsg} onClose={() => setProfileMsg(null)} />}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Registered)</label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: '#F1F5F9', color: 'var(--color-text-muted)' }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
              Email address cannot be changed as it identifies your account.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileLoading}
            style={{ marginTop: '10px' }}
          >
            {profileLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="card" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          Update Security Password
        </h3>

        {passMsg && <Alert type="success" message={passMsg} onClose={() => setPassMsg(null)} />}
        {passError && <Alert type="danger" message={passError} onClose={() => setPassError(null)} />}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter current password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter new password"
              value={passwords.confirmNewPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-outline"
            disabled={passLoading}
            style={{ marginTop: '10px' }}
          >
            {passLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
