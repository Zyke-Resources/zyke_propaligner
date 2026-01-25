import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listen } from '../utils/nui-events';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import '../../styling/timeline.css';

interface AnimationProgressData {
	duration: number;
	speed: number;
	isPaused: boolean;
	delayBetweenLoops: number;
	startedAt: number;
	isActive: boolean;
}

const AnimationTimeline = () => {
	const [animData, setAnimData] = useState<AnimationProgressData | null>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [isInDelay, setIsInDelay] = useState(false);
	const animationRef = useRef<number | null>(null);
	const startTimeRef = useRef<number>(0);
	const pausedAtRef = useRef<number>(0);

	listen("UpdateAnimationProgress", (data: AnimationProgressData) => {
		setAnimData(data);

		if (data.isActive && !data.isPaused) {
			// Reset animation start time for sync
			startTimeRef.current = performance.now();
			pausedAtRef.current = 0;
			setCurrentTime(0);
			setIsInDelay(false);
		} else if (data.isPaused) {
			pausedAtRef.current = currentTime;
		}
	});

	// Local time counter using requestAnimationFrame
	useEffect(() => {
		if (!animData || !animData.isActive) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
			return;
		}

		const updateTime = () => {
			if (!animData || animData.isPaused) {
				return;
			}

			const elapsed = (performance.now() - startTimeRef.current) / 1000;
			const adjustedElapsed = elapsed * animData.speed;

			// Full cycle = animation duration + delay
			const fullCycle = animData.duration + animData.delayBetweenLoops;
			const cyclePosition = adjustedElapsed % fullCycle;

			// Check if we're in the delay period
			if (cyclePosition > animData.duration) {
				setIsInDelay(true);
				setCurrentTime(animData.duration); // Cap at duration during delay
			} else {
				setIsInDelay(false);
				setCurrentTime(cyclePosition);
			}

			animationRef.current = requestAnimationFrame(updateTime);
		};

		if (!animData.isPaused) {
			animationRef.current = requestAnimationFrame(updateTime);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [animData?.isActive, animData?.isPaused, animData?.speed, animData?.duration, animData?.delayBetweenLoops]);

	useEffect(() => {
		if (animData?.isPaused) {
			setCurrentTime(pausedAtRef.current);
		}
	}, [animData?.isPaused]);

	if (!animData || !animData.isActive) {
		return null;
	}

	const formatTime = (time: number) => {
		return time.toFixed(2);
	};

	// Progress percentage for the "tick" / "playhead" position
	const progress = Math.min((currentTime / animData.duration) * 100, 100);

	const renderStateIcon = () => {
		if (animData.isPaused) {
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
				className="animation-timeline"
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

				{/* Timeline track with playhead */}
				<div className="timeline-track">
					<div
						className={`timeline-playhead ${animData.isPaused ? 'paused' : ''} ${isInDelay ? 'waiting' : ''}`}
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
