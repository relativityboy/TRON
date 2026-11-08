import {CYCLE_FORMATION_TIMING} from '../simulation/config/light-cycles.js';
export const MP=Object.freeze({
 protocol:5,legacyProtocol:1,maxPlayers:12,maxCyclesPerTeam:3,maxConnections:64,tickHz:120,snapshotTicks:4,
 maxConnectionsPerIp:3,maxConnectionsPerIpPerWindow:12,connectionWindowMs:60000,maxTrackedIps:4096,
 inputLeadTicks:0,maxFutureTicks:24,maxLateTicks:24,turnIntervalTicks:6,
 countdownSeconds:0,formationSeconds:CYCLE_FORMATION_TIMING.formationSeconds,materializationSeconds:CYCLE_FORMATION_TIMING.formationSeconds,launchHoldSeconds:CYCLE_FORMATION_TIMING.launchHoldSeconds,cameraTravelSeconds:3,cameraReadyTimeoutSeconds:45,resultSeconds:10,maxMatchSeconds:180,maxTrails:2048,
 inputTimeoutTicks:120,heartbeatSeconds:10,connectionTimeoutSeconds:35,
 maxMessageBytes:512,maxMessagesPerSecond:80,maxBufferedBytes:512*1024,
 maxCatchupSteps:24,startFormationSpacingCells:1,
});
