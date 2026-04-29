import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "../utils/Modal";
import { useTranslation } from "../../context/Translation";
import { useModalContext } from "../../context/ModalContext";
import { listen, callback } from "../utils/nui-events";
import Button from "../utils/Button";
import HistoryIcon from "@mui/icons-material/History";
import { HistoryData } from "../../types";
import HistoryList from "./HistoryList";

interface HistoryProps {
    loadHistory: (data: HistoryData) => void;
}

const History: React.FC<HistoryProps> = ({ loadHistory }) => {
    const T = useTranslation();
    const [history, setHistory] = useState<Array<HistoryData>>([]);
    const { openModal, modalsOpen } = useModalContext();
    const modalId = "loadHistory";
    const [loading, setLoading] = useState<boolean>(true);
    const chunksRef = useRef<Map<number, HistoryData[]>>(new Map());
    const totalRef = useRef<number>(0);

    const handleHistoryChunk = useCallback((data: { itemsJson: string; index: number; total: number }) => {
        const items: HistoryData[] = JSON.parse(data.itemsJson);
        chunksRef.current.set(data.index, items);
        totalRef.current = data.total;

        if (chunksRef.current.size === data.total) {
            const sorted: HistoryData[] = [];
            for (let i = 0; i < data.total; i++) {
                const chunk = chunksRef.current.get(i);
                if (chunk) sorted.push(...chunk);
            }
            chunksRef.current.clear();
            setHistory(sorted);
            setLoading(false);
        }
    }, []);

    listen("HistoryChunk", handleHistoryChunk);

    useEffect(() => {
        if (!modalsOpen[modalId]) return setLoading(true);

        chunksRef.current.clear();
        setTimeout(() => {
            callback("GetHistory");
        }, 100);
    }, [modalsOpen[modalId]]);

    return (
        <>
            <Button
                wide
                icon={<HistoryIcon />}
                onClick={() => openModal("loadHistory")}
            >
                {T("loadHistoryTitle")}
            </Button>

            <Modal
                id={modalId}
                title={T("loadHistoryTitle")}
                icon={<HistoryIcon />}
                closeButton
                loading={loading}
            >
                <HistoryList history={history} loadHistory={loadHistory} />
            </Modal>
        </>
    );
};

export default History;
