import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { AnalysisResult, MediaItem, SocialContentResult, ContentGenerationState, MediaItemStatus } from './types';
import { analyzeVideo, analyzeImage, fileToBase64, generateSocialContent } from './services/geminiService';
import { VideoIcon, ImageIcon, LoaderIcon, TrashIcon, CreateContentIcon, RegenerateIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon, GoalIcon, TitleIcon, CaptionIcon, HashtagIcon, ImageIdeaIcon, TimeIcon, NoteIcon, TipIcon } from './components/icons';
import DeveloperModeView from './components/DeveloperModeView';

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const IRIS_LOGO_BASE64 = "data:image/png;base64,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";

const App: React.FC = () => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isDevMode, setIsDevMode] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            mediaItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
        };
    }, []); 

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        setGlobalError(null);
        const newItems: MediaItem[] = [];

        for (const file of Array.from(files)) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setGlobalError(`Tệp "${file.name}" quá lớn. Vui lòng chọn tệp nhỏ hơn ${MAX_FILE_SIZE_MB}MB.`);
                continue;
            }

            let type: 'video' | 'image' | null = null;
            if (file.type.startsWith('video/')) {
                type = 'video';
            } else if (file.type.startsWith('image/')) {
                type = 'image';
            } else {
                 setGlobalError(`Tệp "${file.name}" có định dạng không hợp lệ. Vui lòng chọn video hoặc hình ảnh.`);
                continue;
            }

            const newItem: MediaItem = {
                id: `${file.name}-${file.lastModified}-${file.size}`,
                file,
                type,
                previewUrl: URL.createObjectURL(file),
                status: 'pending',
                result: null,
                error: null,
                content: {
                    kids: { status: 'idle', result: null, error: null, rating: null, feedbackText: null, prompt: null },
                    mg: { status: 'idle', result: null, error: null, rating: null, feedbackText: null, prompt: null },
                },
            };
            newItems.push(newItem);
        }
        setMediaItems(prev => [...prev, ...newItems]);
        
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const processSingleItem = async (itemToProcess: MediaItem) => {
        setMediaItems(prev => prev.map(item =>
            item.id === itemToProcess.id ? { ...item, status: 'loading', error: null } : item
        ));

        try {
            const base64Media = await fileToBase64(itemToProcess.file);
            let analysisResult: AnalysisResult;

            if (itemToProcess.type === 'video') {
                analysisResult = await analyzeVideo(base64Media, itemToProcess.file.type);
            } else {
                analysisResult = await analyzeImage(base64Media, itemToProcess.file.type);
            }

            setMediaItems(prev => prev.map(item =>
                item.id === itemToProcess.id ? { ...item, status: 'success', result: analysisResult } : item
            ));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
            setMediaItems(prev => prev.map(item =>
                item.id === itemToProcess.id ? { ...item, status: 'error', error: errorMessage } : item
            ));
        }
    };

    const handleAnalyzeAll = () => {
        mediaItems.forEach(item => {
            if (item.status === 'pending') {
                processSingleItem(item);
            }
        });
    };

    const handleGenerateContent = async (itemId: string, audience: 'kids' | 'mg', feedback?: string) => {
        const itemToProcess = mediaItems.find(item => item.id === itemId);
        if (!itemToProcess || !itemToProcess.result) return;

        setMediaItems(prev => prev.map(item =>
            item.id === itemId ? {
                ...item,
                content: { ...item.content, [audience]: { ...item.content[audience], status: 'loading', result: null, error: null } }
            } : item
        ));

        try {
            const contentData = await generateSocialContent(itemToProcess.result, audience, feedback);
            setMediaItems(prev => prev.map(item =>
                item.id === itemId ? {
                    ...item,
                    content: { ...item.content, [audience]: { ...item.content[audience], status: 'success', result: contentData.result, prompt: contentData.prompt, error: null } }
                } : item
            ));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo nội dung.";
            setMediaItems(prev => prev.map(item =>
                item.id === itemId ? {
                    ...item,
                    content: { ...item.content, [audience]: { ...item.content[audience], status: 'error', result: null, error: errorMessage } }
                } : item
            ));
        }
    };

     const handleSaveFeedback = (itemId: string, audience: 'kids' | 'mg', rating: number, feedbackText: string) => {
        setMediaItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newContentState = { ...item.content[audience], rating, feedbackText };
                return {
                    ...item,
                    content: { ...item.content, [audience]: newContentState }
                };
            }
            return item;
        }));
    };
    
    const handleRemoveItem = (id: string) => {
        setMediaItems(prev => {
             const itemToRemove = prev.find(i => i.id === id);
             if (itemToRemove) {
                 URL.revokeObjectURL(itemToRemove.previewUrl);
             }
            return prev.filter(i => i.id !== id)
        });
    };

    const handleClearAll = () => {
        mediaItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
        setMediaItems([]);
    };

    const triggerFileSelect = () => fileInputRef.current?.click();
    
    const pendingCount = mediaItems.filter(item => item.status === 'pending').length;

    return (
        <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            <main className="w-full max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700 mb-6">
                    <div className="flex items-center space-x-4">
                        <img src={IRIS_LOGO_BASE64} alt="IRIS English Logo" className="h-16 w-auto"/>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                             onClick={() => setIsDevMode(!isDevMode)}
                             className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            {isDevMode ? 'Chế độ User' : 'Developer Mode'}
                        </button>
                        <div className="text-center sm:text-right">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Content Studio</h1>
                            <p className="text-slate-500 dark:text-slate-400">Công cụ sáng tạo nội dung cho IRIS English</p>
                        </div>
                    </div>
                </header>
                
                <div className="w-full">
                    {isDevMode ? (
                        <DeveloperModeView mediaItems={mediaItems} />
                    ) : (
                        <>
                        {mediaItems.length === 0 ? (
                            <div 
                                onClick={triggerFileSelect} 
                                className="relative block w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-300"
                            >
                                <div className="flex justify-center items-center space-x-4 mb-4 text-slate-400 dark:text-slate-500">
                                    <VideoIcon className="h-12 w-12" />
                                    <ImageIcon className="h-12 w-12" />
                                </div>
                                <span className="mt-2 block text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Kéo thả hoặc nhấn để tải tệp lên
                                </span>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Hỗ trợ video và hình ảnh (Tối đa {MAX_FILE_SIZE_MB}MB mỗi tệp)
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl sticky top-4 z-10 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <button
                                        onClick={handleAnalyzeAll}
                                        disabled={pendingCount === 0}
                                        className="flex-grow px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105 disabled:bg-blue-400 dark:disabled:bg-blue-900 disabled:cursor-not-allowed disabled:transform-none disabled:text-slate-300"
                                    >
                                        Phân Tích {pendingCount} Tệp
                                    </button>
                                    <button
                                        onClick={triggerFileSelect}
                                        className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-offset-slate-800 transition"
                                    >
                                        Thêm Tệp
                                    </button>
                                    <button
                                        onClick={handleClearAll}
                                        className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 dark:focus:ring-offset-slate-800 transition"
                                    >
                                        Xóa Tất Cả
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {mediaItems.map(item => (
                                        <MediaItemCard key={item.id} item={item} onRemove={handleRemoveItem} onGenerateContent={handleGenerateContent} onSaveFeedback={handleSaveFeedback} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*,image/*"
                            multiple
                            onChange={handleFileChange}
                            className="sr-only"
                        />
                        {globalError && (
                            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
                                <p><span className="font-bold">Lỗi:</span> {globalError}</p>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </main>
            <footer className="text-center mt-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    © {new Date().getFullYear()} IRIS English | AI Content Studio
                </p>
            </footer>
        </div>
    );
};

const StatusBadge: React.FC<{ status: MediaItemStatus }> = ({ status }) => {
    const statusConfig = {
        pending: { text: "Đang chờ", icon: ClockIcon, color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50" },
        loading: { text: "Đang phân tích...", icon: LoaderIcon, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50" },
        success: { text: "Hoàn thành", icon: CheckCircleIcon, color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50" },
        error: { text: "Lỗi", icon: ExclamationCircleIcon, color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50" },
    };
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Icon className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
            {config.text}
        </div>
    );
};


const MediaItemCard: React.FC<{ 
    item: MediaItem; 
    onRemove: (id: string) => void; 
    onGenerateContent: (id: string, audience: 'kids' | 'mg', feedback?: string) => void;
    onSaveFeedback: (itemId: string, audience: 'kids' | 'mg', rating: number, feedbackText: string) => void;
}> = ({ item, onRemove, onGenerateContent, onSaveFeedback }) => {
    const renderResultContent = () => {
        if (!item.result) return null;
        if (item.result.type === 'video') {
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Mô Tả</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.result.description}</p>
                    </div>
                    <details className="group">
                         <summary className="text-sm font-semibold text-slate-800 dark:text-white cursor-pointer list-none flex items-center justify-between">
                            <span>Bản Ghi</span>
                            <span className="text-slate-400 transition-transform duration-300 group-open:rotate-90">&#x25B6;</span>
                        </summary>
                        <div className="mt-2 max-h-32 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{item.result.transcript}</p>
                        </div>
                    </details>
                </div>
            );
        }
        if (item.result.type === 'image') {
             return (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Mô Tả</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.result.description}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Văn bản trong ảnh</h4>
                         <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{item.result.textInImage}</p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 animate-fade-in">
            <div className="relative">
                {item.type === 'video' ? (
                    <video src={item.previewUrl} controls className="w-full h-48 object-cover bg-slate-200 dark:bg-slate-700"></video>
                ) : (
                    <img src={item.previewUrl} alt="Xem trước" className="w-full h-48 object-cover bg-slate-200 dark:bg-slate-700" />
                )}
                 <button onClick={() => onRemove(item.id)} className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1.5 text-white hover:bg-opacity-75 transition-transform hover:scale-110">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 flex-grow flex flex-col space-y-4">
                 <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate" title={item.file.name}>{item.file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                
                <div className="flex-grow space-y-4">
                    <StatusBadge status={item.status} />
                    {item.status === 'error' && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded-md">
                           <p className="font-bold">Lỗi:</p>
                           <p>{item.error}</p>
                        </div>
                    )}
                    {item.status === 'success' && renderResultContent()}
                </div>

                {item.status === 'success' && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                        <ContentGenerationUnit item={item} audience="kids" onGenerate={onGenerateContent} onSaveFeedback={onSaveFeedback} />
                        <ContentGenerationUnit item={item} audience="mg" onGenerate={onGenerateContent} onSaveFeedback={onSaveFeedback} />
                    </div>
                )}
            </div>
        </div>
    )
};

const FeedbackForm: React.FC<{ onSubmit: (rating: number, feedbackText: string) => void; }> = ({ onSubmit }) => {
    const [rating, setRating] = useState<number | null>(null);
    const [feedbackText, setFeedbackText] = useState('');

    const handleSubmit = () => {
        if (rating !== null) {
            onSubmit(rating, feedbackText);
        }
    };

    return (
        <div className="space-y-3 p-3 bg-slate-100 dark:bg-slate-900/70 rounded-lg">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center">Đánh giá nội dung này</p>
            <div className="flex justify-center gap-1 flex-wrap">
                {[...Array(10)].map((_, i) => {
                    const score = i + 1;
                    return (
                        <button
                            key={score}
                            onClick={() => setRating(score)}
                            className={`w-7 h-7 text-xs font-bold rounded-full transition-all duration-200 flex-shrink-0
                                ${rating === score
                                    ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-400'
                                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-blue-800'
                                }`}
                        >
                            {score}
                        </button>
                    );
                })}
            </div>
            <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Bạn muốn AI cải thiện điều gì? (tùy chọn)..."
                className="w-full text-xs p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition"
                rows={2}
            />
            <button
                onClick={handleSubmit}
                disabled={rating === null}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Gửi đánh giá</span>
            </button>
        </div>
    );
};


const ContentGenerationUnit: React.FC<{
    item: MediaItem;
    audience: 'kids' | 'mg';
    onGenerate: (id: string, audience: 'kids' | 'mg', feedback?: string) => void;
    onSaveFeedback: (itemId: string, audience: 'kids' | 'mg', rating: number, feedbackText: string) => void;
}> = ({ item, audience, onGenerate, onSaveFeedback }) => {
    const [feedback, setFeedback] = useState('');
    const contentState = item.content[audience];
    const isKids = audience === 'kids';
    const audienceLabel = isKids ? 'Kids' : 'MG';

    const handleGenerate = () => {
        let combinedFeedback = '';
        if (contentState.rating) {
            combinedFeedback += `Người dùng đã đánh giá phiên bản trước ${contentState.rating}/10. `;
            if (contentState.feedbackText) {
                combinedFeedback += `Phản hồi của họ là: "${contentState.feedbackText}".\n`;
            }
        }
        if (feedback.trim()) {
             combinedFeedback += `Bây giờ, họ yêu cầu cải thiện thêm: "${feedback}"`;
        } else if (combinedFeedback) {
             combinedFeedback += `Hãy tạo một phiên bản khác dựa trên đánh giá đó.`;
        }
        onGenerate(item.id, audience, combinedFeedback.trim());
    };

    const handleFeedbackSubmit = (rating: number, feedbackText: string) => {
        onSaveFeedback(item.id, audience, rating, feedbackText);
    };

    if (contentState.status === 'idle') {
        return <GenerateContentButton audience={audience} state={contentState} onClick={() => onGenerate(item.id, audience)} />;
    }

    if (contentState.status === 'loading') {
        const text = isKids ? 'Đang tạo cho Kids...' : 'Đang tạo cho MG...';
        return (
            <button disabled className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-wait">
                <LoaderIcon className="w-4 h-4 animate-spin" />
                <span>{text}</span>
            </button>
        );
    }

    if (contentState.status === 'error') {
        return (
            <div className="p-3 bg-red-50 dark:bg-red-900/50 rounded-lg text-left">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">Lỗi tạo nội dung ({audienceLabel})</p>
                <p className="text-xs mt-1 text-red-600 dark:text-red-400">{contentState.error}</p>
                <button
                    onClick={() => onGenerate(item.id, audience)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition bg-red-100 hover:bg-red-200 dark:bg-red-800/50 dark:hover:bg-red-800 text-red-700 dark:text-red-200"
                >
                    <RegenerateIcon className="w-4 h-4" />
                    <span>Thử lại</span>
                </button>
            </div>
        );
    }

    if (contentState.status === 'success' && contentState.result) {
        return (
            <div className="space-y-3">
                <SocialContentDisplay content={contentState.result} audience={audienceLabel} />
                
                {!contentState.rating ? (
                     <FeedbackForm onSubmit={handleFeedbackSubmit} />
                ) : (
                     <div className="text-center p-2 bg-green-100 dark:bg-green-900/50 rounded-md">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300">Cảm ơn bạn đã đánh giá!</p>
                    </div>
                )}

                <div className="space-y-2 pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Thêm gợi ý để cải thiện (tùy chọn)..."
                        className="w-full text-xs p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition"
                        rows={2}
                    />
                    <button
                        onClick={handleGenerate}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100"
                    >
                        <RegenerateIcon className="w-4 h-4" />
                        <span>Tạo lại</span>
                    </button>
                </div>
            </div>
        );
    }

    return null;
};


const GenerateContentButton: React.FC<{
    audience: 'kids' | 'mg';
    state: ContentGenerationState;
    onClick: () => void;
}> = ({ audience, state, onClick }) => {
    const isKids = audience === 'kids';
    const text = isKids ? 'Tạo Content Kids' : 'Tạo Content MG';
    const baseClasses = "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transform hover:scale-105";
    const colorClasses = isKids
        ? "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400 disabled:bg-amber-300"
        : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400 disabled:bg-blue-300";

    return (
        <button onClick={onClick} disabled={state.status === 'loading'} className={`${baseClasses} ${colorClasses}`}>
            {state.status === 'loading'
                ? <LoaderIcon className="w-4 h-4 animate-spin" />
                : <CreateContentIcon className="w-4 h-4" />
            }
            <span>{text}</span>
        </button>
    );
};

const SocialContentDisplay: React.FC<{ content: SocialContentResult, audience: string }> = ({ content, audience }) => {
    const renderListItem = (Icon: React.FC<{className?: string}>, title: string, value: string | string[], valueClasses?: string) => (
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-md mt-0.5">
                <Icon className="w-3 h-3 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">{title}</p>
                {Array.isArray(value) ? (
                     <ul className="list-disc list-inside space-y-1 mt-1">
                        {value.map((item, i) => <li key={i} className="text-slate-600 dark:text-slate-300">{item}</li>)}
                    </ul>
                ) : (
                    <p className={`text-slate-600 dark:text-slate-300 ${valueClasses || ''}`}>{value}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-3 space-y-4 bg-slate-100 dark:bg-slate-900/70 rounded-lg text-xs">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Nội dung đề xuất cho {audience}</h4>
            
            <div className="space-y-3">
                 {renderListItem(GoalIcon, "Mục tiêu", content.goal_summary)}
                {renderListItem(TitleIcon, "Tiêu đề", content.title)}
                {renderListItem(CaptionIcon, "Caption", content.caption, "whitespace-pre-wrap bg-white dark:bg-slate-800 p-2 rounded mt-1 border border-slate-200 dark:border-slate-700")}
                {renderListItem(HashtagIcon, "Hashtags", content.hashtags.join(' '), "text-blue-500")}
                {renderListItem(ImageIdeaIcon, "Gợi ý hình ảnh", content.suggested_image_ideas)}
                {renderListItem(TimeIcon, "Thời gian đăng", content.optimal_post_time)}
                {renderListItem(NoteIcon, "Ghi chú triển khai", content.implementation_notes)}
                {renderListItem(TipIcon, "Gợi ý tối ưu", content.optimization_tips)}
            </div>
        </div>
    );
};


export default App;