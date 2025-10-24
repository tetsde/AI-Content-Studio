import React from 'react';
import type { MediaItem, ContentGenerationState } from '../types';
import { VideoIcon, ImageIcon } from './icons';

const GenerationDetails: React.FC<{
    state: ContentGenerationState;
    title: string;
}> = ({ state, title }) => {
    if (state.status === 'idle') {
        return null;
    }

    return (
        <details className="mt-4 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <summary className="font-semibold text-md cursor-pointer text-slate-800 dark:text-slate-100">
                {title}
            </summary>
            <div className="mt-3 space-y-4 text-xs">
                {state.prompt && (
                    <div>
                        <h4 className="font-bold text-slate-600 dark:text-slate-300">Prompt đã gửi:</h4>
                        <pre className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-md whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 max-h-60 overflow-y-auto">
                           <code>{state.prompt}</code>
                        </pre>
                    </div>
                )}
                 {state.result && (
                    <div>
                        <h4 className="font-bold text-slate-600 dark:text-slate-300">Kết quả JSON:</h4>
                        <pre className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-md whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 max-h-60 overflow-y-auto">
                           <code>{JSON.stringify(state.result, null, 2)}</code>
                        </pre>
                    </div>
                )}
                 {(state.rating || state.feedbackText) && (
                     <div>
                        <h4 className="font-bold text-slate-600 dark:text-slate-300">Đánh giá của người dùng:</h4>
                        <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-md space-y-1 border border-slate-200 dark:border-slate-600">
                           {state.rating && <p><strong>Điểm:</strong> {state.rating}/10</p>}
                           {state.feedbackText && <p><strong>Feedback:</strong> "{state.feedbackText}"</p>}
                        </div>
                    </div>
                 )}
                 {state.error && (
                      <div>
                        <h4 className="font-bold text-red-600 dark:text-red-400">Lỗi:</h4>
                        <p className="mt-1 p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{state.error}</p>
                    </div>
                 )}
            </div>
        </details>
    );
};


const DeveloperModeView: React.FC<{ mediaItems: MediaItem[] }> = ({ mediaItems }) => {
    if (mediaItems.length === 0) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Developer Mode</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Chưa có tệp nào được tải lên để hiển thị dữ liệu.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600 pb-2">Developer Mode</h2>
            {mediaItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {item.type === 'image' 
                                ? <img src={item.previewUrl} className="w-24 h-24 object-cover rounded-md" />
                                : <video src={item.previewUrl} className="w-24 h-24 object-cover rounded-md bg-black" />
                            }
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate" title={item.file.name}>{item.file.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.type === 'video' ? <VideoIcon className="w-4 h-4 inline mr-1"/> : <ImageIcon className="w-4 h-4 inline mr-1" />} {item.file.type} - {(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200">Phân tích ban đầu:</h4>
                        {item.status === 'success' && item.result ? (
                             <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md whitespace-pre-wrap font-mono text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 max-h-40 overflow-y-auto">
                                <code>{JSON.stringify(item.result, null, 2)}</code>
                            </pre>
                        ): (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">{item.status === 'error' ? `Lỗi: ${item.error}`: `Trạng thái: ${item.status}`}</p>
                        )}
                    </div>
                    
                    <GenerationDetails state={item.content.kids} title="Nội dung Kids" />
                    <GenerationDetails state={item.content.mg} title="Nội dung MG" />
                </div>
            ))}
        </div>
    );
};

export default DeveloperModeView;
