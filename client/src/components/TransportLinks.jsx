import React from 'react';

// Transport moda data with official links
const transportModa = [
    {
        id: 'transjakarta',
        name: 'TransJakarta',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Transjakarta_logo.svg/800px-Transjakarta_logo.svg.png',
        url: 'https://transjakarta.co.id/',
        bgColor: 'bg-white'
    },
    {
        id: 'jaklingko',
        name: 'JakLingko',
        logo: 'https://jaklingko.id/assets/images/logo.png',
        url: 'https://jaklingko.id/',
        bgColor: 'bg-white'
    },
    {
        id: 'lrt',
        name: 'LRT Jakarta',
        logo: 'https://upload.wikimedia.org/wikipedia/id/thumb/c/ca/Logo_LRT_Jakarta.svg/800px-Logo_LRT_Jakarta.svg.png',
        url: 'https://www.lrtjakarta.co.id/',
        bgColor: 'bg-white'
    },
    {
        id: 'kai',
        name: 'KAI Commuter',
        logo: 'https://upload.wikimedia.org/wikipedia/id/thumb/1/1f/Logo_KAI_Commuter.svg/800px-Logo_KAI_Commuter.svg.png',
        url: 'https://www.krl.co.id/',
        bgColor: 'bg-white'
    },
    {
        id: 'whoosh',
        name: 'Whoosh',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Whoosh_logo.svg/800px-Whoosh_logo.svg.png',
        url: 'https://whoosh.id/',
        bgColor: 'bg-white'
    },
];

export default function TransportLinks() {
    return (
        <div className="flex flex-col gap-3 w-full px-2">
            {/* Section Header */}
            <div className="px-2 pt-2">
                <h3 className="font-bold text-sm capitalize text-black">
                    Lanjutkan Perjalanan
                </h3>
            </div>

            {/* Top row - 3 items */}
            <div className="flex gap-1.5">
                {transportModa.slice(0, 3).map((moda) => (
                    <a
                        key={moda.id}
                        href={moda.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 h-20 ${moda.bgColor} rounded-2xl flex items-center justify-center overflow-hidden hover:shadow-md transition-shadow`}
                    >
                        <img
                            src={moda.logo}
                            alt={moda.name}
                            className="max-h-12 max-w-[80%] object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-xs font-semibold text-grey-600">${moda.name}</span>`;
                            }}
                        />
                    </a>
                ))}
            </div>

            {/* Bottom row - 2 items */}
            <div className="flex gap-1.5">
                {transportModa.slice(3).map((moda) => (
                    <a
                        key={moda.id}
                        href={moda.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 h-16 ${moda.bgColor} rounded-2xl flex items-center justify-center overflow-hidden hover:shadow-md transition-shadow`}
                    >
                        <img
                            src={moda.logo}
                            alt={moda.name}
                            className="max-h-8 max-w-[80%] object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-xs font-semibold text-grey-600">${moda.name}</span>`;
                            }}
                        />
                    </a>
                ))}
            </div>
        </div>
    );
}
