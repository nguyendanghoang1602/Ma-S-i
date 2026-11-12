import React from 'react';
import { useGame } from './context/GameContext';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { NightView } from './components/NightView';
import { DayDiscussionView } from './components/DayDiscussionView';
import { VotingView } from './components/VotingView';
import { ChatBox } from './components/ChatBox';
import { LogsView } from './components/LogsView';
import { MobileTabBar } from './components/MobileTabBar';
import { RolePeekModal } from './components/RolePeekModal';
import { SeerResultModal } from './components/SeerResultModal';
import { HunterRevengeModal } from './components/HunterRevengeModal';
import { GameOverModal } from './components/GameOverModal';

export const AppContent: React.FC = () => {
  const { roomState, activeTab } = useGame();

  if (!roomState || roomState.phase === 'LOBBY') {
    return <LobbyView />;
  }

  const renderActivePhaseView = () => {
    switch (roomState.phase) {
      case 'NIGHT':
        return <NightView />;
      case 'DAY_DISCUSSION':
        return <DayDiscussionView />;
      case 'DAY_VOTING':
        return <VotingView />;
      case 'GAME_OVER':
        return <DayDiscussionView />;
      default:
        return <LobbyView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c13] text-gray-100 flex flex-col">
      {/* Sticky Top Header with compact countdown timer, room code copy, role peek, fullscreen */}
      <Header />

      {/* Main Game Screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        {/* DESKTOP LAYOUT (sm:grid with 2 columns: Card Board on left 65%, Chat on right 35%) */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-4">
          <div className="sm:col-span-7 md:col-span-8">
            {renderActivePhaseView()}
          </div>
          <div className="sm:col-span-5 md:col-span-4 sticky top-14 h-[calc(100vh-80px)]">
            <ChatBox isEmbedded={true} />
          </div>
        </div>

        {/* MOBILE LAYOUT (Single view toggled seamlessly via MobileTabBar) */}
        <div className="sm:hidden">
          {activeTab === 'cards' && renderActivePhaseView()}
          {activeTab === 'chat' && <ChatBox isEmbedded={false} />}
          {activeTab === 'logs' && <LogsView />}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />

      {/* Drawers & Modals */}
      <RolePeekModal />
      <SeerResultModal />
      <HunterRevengeModal />
      <GameOverModal />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
