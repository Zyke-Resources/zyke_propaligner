// The container around the keybind

import { Box } from '@mantine/core';
import React from 'react';

interface KeybindContainerProps {
	label: string;
	keyBind: string | string[];
	func: () => void;
	isFirst: boolean;
}

const KeybindContainer: React.FC<KeybindContainerProps> = ({ label, keyBind, func, isFirst }) => {
	return (
		<div style={{
			position: "relative",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			height: "4rem",
			padding: "0.5rem 1rem",
		}}>
			{!isFirst && (
				<div style={{
					width: "2px",
					height: "70%",
					background: "rgba(var(--grey5), 1.0)",
					marginRight: "2rem",
				}} />
			)}

			<Box
				sx={{
					boxSizing: "border-box",
					display: "flex",
					alignItems: "center",
					fontSize: "1.2rem",
					gap: "0.8rem",

					["& kbd, & p"]: {
						fontFamily: "Saira, Ubuntu Mono, monospace",
					},
				}}
			>
				{Array.isArray(keyBind) ? (
					<div
						style={{
							display: "flex",
							gap: "0.5rem",
						}}
					>
						{keyBind.map((key, idx) => (
							<kbd key={idx}>{key}</kbd>
						))}
					</div>
				) : (
					<kbd>
						{keyBind || label}
					</kbd>
				)}

				<p style={{
					whiteSpace: "nowrap",
				}}>{label}</p>

			</Box>
		</div>
	);
};

export default KeybindContainer;