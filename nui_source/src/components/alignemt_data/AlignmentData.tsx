import { useState } from 'react'
import { ParticleAlignmentData, PropAlignmentData } from '../../types';
import { listen } from '../utils/nui-events';
import Keybinds from './Keybinds';

interface AlignmentData {
	orgPos: { x: number; y: number; z: number };
	isActive: boolean;
	anim: { dict: string; clip: string };
	props: PropAlignmentData[];
	particles: ParticleAlignmentData[];
	currMode: "prop" | "particle";
	propIdx: number;
	particleIdx: number;
	propHighlight: boolean;
	pos: { x: number; y: number; z: number };
	propRaise: number;
	buttons: { items: [] }
}

const AlignmentData = () => {
	const [alignmentData, setAlignmentData] = useState<AlignmentData>({
		orgPos: { x: 0, y: 0, z: 0 },
		isActive: false,
		anim: { dict: "", clip: "" },
		props: [],
		particles: [],
		currMode: "prop",
		propIdx: 0,
		particleIdx: 0,
		propHighlight: false,
		pos: { x: 0, y: 0, z: 0 },
		propRaise: 0,
		buttons: { items: [] },
	})

	listen("UpdateAlignmentUIData", (data: AlignmentData) => {
		setAlignmentData(data);
	})

	return (
		<div style={{
			position: "absolute",
			bottom: "1rem",
			left: "50%",
			transform: "translateX(-50%)",
			zIndex: 10,
		}}>
			<div className="alignment-data">

			</div>
			<Keybinds items={alignmentData.buttons.items} />
		</div>
	)
}

export default AlignmentData