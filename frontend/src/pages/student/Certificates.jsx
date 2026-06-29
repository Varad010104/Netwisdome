import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Lock } from 'lucide-react';
import './certificate.css';
import { getStoredUserInfo } from '../../utils/userInfo';

import API from '../../services/api';

const Certificate = () => {
  const certificateRef = useRef(null);
  const userInfo = getStoredUserInfo();
  const studentName = userInfo?.name || 'STUDENT NAME';
  const [isIssued, setIsIssued] = useState(
    userInfo?.certificateStatus === 'issued' || userInfo?.certificateIssued === true
  );
  const [joiningDate, setJoiningDate] = useState(() => {
    if (!userInfo?.createdAt) return '';
    const d = new Date(userInfo.createdAt);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });
  const [issuedDate, setIssuedDate] = useState(() => {
    if (!userInfo?.certificateIssuedAt) return '';
    const d = new Date(userInfo.certificateIssuedAt);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });

  useEffect(() => {
    const refreshStatus = async () => {
      if (!userInfo?._id) return;
      try {
        const res = await API.get(`/auth/student/${userInfo._id}`);
        const updated = res.data?.student || res.data?.data || null;
        if (updated) {
          const nextStatus = updated?.certificateStatus === 'issued' || updated?.certificateIssued === true;
          setIsIssued(nextStatus);
          if (updated?.createdAt) {
            const d = new Date(updated.createdAt);
            if (!Number.isNaN(d.getTime())) {
              setJoiningDate(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
            }
          }
          if (updated?.certificateIssuedAt) {
            const d = new Date(updated.certificateIssuedAt);
            if (!Number.isNaN(d.getTime())) {
              setIssuedDate(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
            }
          } else if (nextStatus) {
            const now = new Date();
            setIssuedDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
          } else {
            setIssuedDate('');
          }
          const stored = {
            ...userInfo,
            certificateStatus: updated.certificateStatus,
            certificateIssued: updated.certificateIssued,
            createdAt: updated.createdAt || userInfo?.createdAt,
            certificateIssuedAt: updated.certificateIssuedAt || (nextStatus ? new Date().toISOString() : null)
          };
          localStorage.setItem('userInfo', JSON.stringify(stored));
        }
      } catch (err) {
        console.error("Error refreshing certificate status:", err);
      }
    };

    refreshStatus();
    const intervalId = setInterval(refreshStatus, 3000);

    const onFocus = () => refreshStatus();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshStatus();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const downloadCertificate = async () => {
    if (!isIssued) return;
    const element = certificateRef.current;
    if (!element) return;
    const card = element.querySelector('.cert-card');
    if (card) {
      card.classList.add('exporting');
    }
    const width = element.offsetWidth || 700;
    const height = element.offsetHeight || 740;
    let canvas;
    try {
      canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
    } finally {
      if (card) {
        card.classList.remove('exporting');
      }
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [width, height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`${studentName}_Certificate.pdf`);
  };

  // Secure conditional render: If locked, render ONLY the lock page. No certificate DOM exists.
  if (!isIssued) {
    return (
      <div className="layout-container locked-center">
        <div className="cert-lock-screen">
          <div className="cert-lock-card">
            <div className="lock-icon-wrapper">
              <Lock size={36} />
            </div>
            <h2>Certificate Locked</h2>
            <p className="lock-description">
              Your Master in Automotive Domain certificate has not been issued yet. 
              Please complete all syllabus requirements and contact your training institute to unlock it.
            </p>
            <div className="contact-info">
              <span>Support: contact@netwisdome.com</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container has-download">
      <div className="sidebar-left">
        <button className="download-btn" onClick={downloadCertificate}>
          Download Certificate
        </button>
      </div>
      <div className="cert-wrapper" ref={certificateRef}>
        <div className="cert-card">
          <div className="corner top-left-navy"></div>
          <div className="corner top-left-gold"></div>
          <div className="corner top-right-navy"></div>
          <div className="corner top-right-gold"></div>

          <div className="content-box">
            <header className="header">
              <div className="logo-area">
                <div className="logo-main">
                  <span className="n-letter">N</span>
                  <span className="net-text">NETWISDOME</span>
                </div>
              </div>
              <div className="iso-text">ISO 9001: 2015</div>
            </header>

            <section className="main-info">
              <h1 className="title-cert">CERTIFICATE</h1>
              <p className="of-text">OF</p>
              <h2 className="master-text">MASTER IN AUTOMOTIVE DOMAIN</h2>

              <div className="recipient-info">
                <p>This certificate is awarded in recognition of successful completion of</p>
                <h3 className="student-display-name">{studentName}</h3>
              </div>

              <p className="desc-text">
                HANDS-ON TRAINING IN MATLAB PROGRAMMING, SIMULINK MODELING, AND SOFTWARE DEVELOPMENT.
                THE PROGRAM FOCUSED ON PRACTICAL APPLICATIONS IN AUTOMOTIVE SYSTEMS, CONTROL SYSTEMS,
                AND EMBEDDED SOFTWARE DEVELOPMENT THROUGH GUIDED PROJECTS AND SIMULATIONS.
              </p>

              <div className="dates">
                <div className="date-item">
                  Joining Date <span className="date-value">{joiningDate || '____________________'}</span>
                </div>
                <div className="date-item">
                  Last Date <span className="date-value">{issuedDate || '____________________'}</span>
                </div>
              </div>
            </section>

            <footer className="footer-signs">
              <div className="sign-block">
                <div className="sign-border"></div>
                <p><strong>CEO</strong></p>
                <p>Netwisdome</p>
              </div>
              <div className="sign-block">
                <div className="sign-border"></div>
                <p><strong>Trainer</strong></p>
                <p>Netwisdome</p>
              </div>
            </footer>
          </div>

          <div className="corner bottom-left-gold"></div>
          <div className="corner bottom-right-gold"></div>
          <div className="corner bottom-navy-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;

