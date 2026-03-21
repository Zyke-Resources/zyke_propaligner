import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listen, send } from '../utils/nui-events';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import '../../styling/timeline.css';

interface AnimationProgressData {
	duration: number;
	speed: number;
	isPaused: boolean;
	isFrozen: boolean;
	isResuming: boolean;
	frozenAnimTime: number; // 0.0 - 1.0 progress
	currentAnimTime: number; // 0.0 - 1.0 progress (actual current position)
	delayBetweenLoops: number;
	startedAt: number;
	isActive: boolean;
}

const AnimationTimeline = () => {
	const [animData, setAnimData] = useState<AnimationProgressData | null>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [isInDelay, setIsInDelay] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const lastFrozenTimeRef = useRef<number>(0);
	const isDraggingRef = useRef(false);
	const trackRef = useRef<HTMLDivElement>(null);
	const animDataRef = useRef<AnimationProgressData | null>(null);

	// Keep a ref in sync with animData so drag callbacks always have current data
	animDataRef.current = animData;

	// Calculate normalized time (0.0 - 1.0) from a mouse event relative to the track
	const getNormalizedTimeFromMouse = useCallback((clientX: number): number => {
		if (!trackRef.current) return 0;
		const rect = trackRef.current.getBoundingClientRect();
		const x = clientX - rect.left;
		return Math.max(0, Math.min(x / rect.width, 1));
	}, []);

	// Send seek to Lua
	const seekTo = useCallback((normalizedTime: number, pause: boolean) => {
		const data = animDataRef.current;
		if (!data || !data.isActive) return;

		send("seekAnimation", { time: normalizedTime, pause }, "seekAnimation");

		// Update UI immediately for responsiveness
		setCurrentTime(normalizedTime * data.duration);
		lastFrozenTimeRef.current = normalizedTime * data.duration;
		setIsInDelay(false);
	}, []);

	// Mouse move handler (attached to window during drag)
	const handleMouseMove = useCallback((e: MouseEvent) => {
		if (!isDraggingRef.current) return;
		const normalizedTime = getNormalizedTimeFromMouse(e.clientX);
		seekTo(normalizedTime, false);
	}, [getNormalizedTimeFromMouse, seekTo]);

	// Mouse up handler (attached to window during drag)
	const handleMouseUp = useCallback(() => {
		isDraggingRef.current = false;
		setIsDragging(false);
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}, [handleMouseMove]);

	// Mouse down on track - start dragging
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const data = animDataRef.current;
		if (!data || !data.isActive) return;
		if (data.isPaused && !data.isFrozen) return; // Animation toggled off with X

		isDraggingRef.current = true;
		setIsDragging(true);

		const normalizedTime = getNormalizedTimeFromMouse(e.clientX);
		seekTo(normalizedTime, true); // First seek forces pause

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}, [getNormalizedTimeFromMouse, seekTo, handleMouseMove, handleMouseUp]);

	// Cleanup listeners on unmount
	useEffect(() => {
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	// Handle state changes (freeze, resume, pause, speed change, etc.)
	listen("UpdateAnimationProgress", (data: AnimationProgressData) => {
		setAnimData(data);

		if (data.isActive && !data.isPaused) {
			if (data.isFrozen) {
				// When freezing, use the frozen time from the game (0.0 - 1.0 * duration)
				const frozenTimeInSeconds = data.frozenAnimTime * data.duration;
				lastFrozenTimeRef.current = frozenTimeInSeconds;
				setCurrentTime(frozenTimeInSeconds);
				setIsInDelay(false);
			} else if (data.isResuming) {
				// Resuming from frozen - show the frozen position until sync takes over
				const frozenTimeInSeconds = lastFrozenTimeRef.current;
				setCurrentTime(frozenTimeInSeconds);
				setIsInDelay(false);
			} else {
				// Animation restarted - reset to beginning
				lastFrozenTimeRef.current = 0;
				setCurrentTime(0);
				setIsInDelay(false);
			}
		} else if (data.isActive && data.isPaused && !data.isFrozen) {
			// Animation toggled off (X key) - reset tick to start
			lastFrozenTimeRef.current = 0;
			setCurrentTime(0);
			setIsInDelay(false);
		}
	});

	// Per-frame sync: game drives the timeline position directly
	// No independent clock, no drift possible
	// Ignore sync messages while dragging so the UI follows the mouse
	listen("SyncAnimationTime", (data: { currentAnimTime: number; isPlaying: boolean }) => {
		if (isDraggingRef.current) return;
		if (!animData || !animData.isActive || animData.isPaused || animData.isFrozen) return;

		if (data.isPlaying) {
			setCurrentTime(data.currentAnimTime * animData.duration);
			setIsInDelay(false);
		} else {
			// Animation between loops (delay period)
			setCurrentTime(animData.duration);
			setIsInDelay(true);
		}
	});

	if (!animData || !animData.isActive) {
		return null;
	}

	const formatTime = (time: number) => {
		return time.toFixed(2);
	};

	// Progress percentage for the "tick" / "playhead" position
	// Clamp between 0 and 100, handle NaN/invalid values
	const safeCurrentTime = Math.max(0, currentTime || 0);
	const safeDuration = animData.duration > 0 ? animData.duration : 1;
	const progress = Math.max(0, Math.min((safeCurrentTime / safeDuration) * 100, 100));

	const renderStateIcon = () => {
		if (animData.isPaused || animData.isFrozen) {
			return <PauseIcon className="timeline-state-icon paused" />;
		}
		if (isInDelay) {
			return <HourglassEmptyIcon className="timeline-state-icon waiting" />;
		}
		return <PlayArrowIcon className="timeline-state-icon playing" />;
	};

	return (
		<AnimatePresence>
			<motion.div
				className={`animation-timeline ${isDragging ? 'dragging' : ''}`}
				initial={{ y: 50, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 50, opacity: 0 }}
				transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
			>
				{/* Play/Pause state indicator */}
				<div className="timeline-state">
					{renderStateIcon()}
					<span className="timeline-speed">{animData.speed.toFixed(2)}x</span>
				</div>

				{/* Timeline track with playhead - draggable */}
				<div
					className="timeline-track"
					ref={trackRef}
					onMouseDown={handleMouseDown}
				>
					<div
						className={`timeline-playhead ${(animData.isPaused || animData.isFrozen) ? 'paused' : ''} ${isInDelay ? 'waiting' : ''}`}
						style={{ left: `${progress}%` }}
					/>
				</div>

				{/* Time display */}
				<div className="timeline-time">
					{formatTime(currentTime)}s / {formatTime(animData.duration)}s
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default AnimationTimeline;
