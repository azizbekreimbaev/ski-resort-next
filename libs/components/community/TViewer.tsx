import React, { useEffect, useRef } from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Viewer } from '@toast-ui/react-editor';

export default function TViewer({ markdown }: { markdown: string }) {
	const viewerRef = useRef<Viewer>(null);
	useEffect(() => {
		viewerRef.current?.getInstance().setMarkdown(markdown);
	}, [markdown]);
	return (
		<div className="article-content-viewer">
			<Viewer ref={viewerRef} initialValue={markdown} usageStatistics={false} />
		</div>
	);
}
