import { AnimatePresence, motion } from 'framer-motion';
import KeybindContainer from './KeybindContainer';

const Keybinds = (buttons: { items: { label: string; key: string | string[]; func: () => void }[] }) => {
	return (
		<AnimatePresence>
			{buttons.items.length > 0 && (
				<motion.div
					className="keybinds"
					initial={{ y: 50, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 50, opacity: 0 }}
					transition={{ duration: 0.25, ease: "easeOut" }}
					style={{
						borderRadius: "var(--lborderRadius)",
						display: "flex",
						flexDirection: "row",
						flexWrap: "wrap",
						justifyContent: "center",
						width: "100%",
						boxSizing: "border-box",
						background: "rgba(var(--dark4), 0.8)",
						border: "1px solid rgba(var(--grey5), 1.0)",
						boxShadow: "0 0 5px 1px rgba(0, 0, 0, 0.5)",
						position: "relative",
					}}
				>
					{buttons.items.map((button, index) => (
						<KeybindContainer
							key={index}
							label={button.label}
							keyBind={button.key}
							func={button.func}
							isFirst={index === 0}
						/>
					))}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default Keybinds;