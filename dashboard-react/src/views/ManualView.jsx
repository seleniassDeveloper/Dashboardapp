import React from 'react';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { MainNavbar } from '../landing/LandingPage';
import ManualContentEs from './ManualContentEs';
import ManualContentEn from './ManualContentEn';
import '../landing/styles/manual.css';

export default function ManualView() {
  const { i18n } = useTranslation();
  
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <MainNavbar />
      <Container fluid className="p-0">
        {i18n.language === 'en' ? <ManualContentEn /> : <ManualContentEs />}
      </Container>
    </div>
  );
}
