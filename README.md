# 🏥 Virtual Patient - Medical Empathy Training AI

![Project Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue)

A professional digital health application designed to train medical empathy through real-time voice interaction with AI-simulated patients. Built with **React** and **Zhipu GLM-4 Realtime API**.

## ✨ Features

- **Real-time Voice Interaction**: Seamless voice conversation with ultra-low latency using WebSocket.
- **Dynamic Patient Personas**:
  - 🧠 **Rationalist**: Logic-driven, requires academic and reasoned empathy.
  - 🌩️ **Blamer**: Emotionally volatile, requires deep validation and de-escalation skills.
- **Tech-Medical Design**:
  - Glassmorphism UI with "Sky Blue" & "Surgical Teal" theme.
  - Interactive breathing animations and ECG-style visualizations.
  - Fully responsive and accessible layout.
- **Intelligent Empathy Detection**: The "Blamer" persona features a built-in "unlock mechanism" that only responds to specific empathetic patterns (Identify -> Label -> Validate).

## 🛠️ Tech Stack

- **Frontend**: React (Vite), CSS3 (Variables, Animations)
- **AI Integration**: Zhipu GLM-Realtime (WebSockets)
- **Audio**: Native Web Audio API (Recorder & Player)
- **Design**: Custom "Digital Health" Design System

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Zhipu AI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ethanranxu/VirtualPatient.git
   cd VirtualPatient
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env` and add your API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   VITE_ZHIPUAI_API_KEY=your_api_key_here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🎮 Usage Guide

1. **Select Persona**: Choose between "Rationalist" or "Blamer" from the dashboard.
2. **Start Call**: Click the large breathing call button to initiate the session.
3. **Speak**: Use your microphone to converse with the patient.
   - For **Rationalist**: Use logic and evidence.
   - For **Blamer**: Focus on emotions, validate their feelings to "unlock" cooperation.
4. **Visual Feedback**: Watch the ECG visualization and status indicators for connection health.

## 📄 License

MIT License
