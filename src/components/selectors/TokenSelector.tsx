import { CatRecord, commands } from '@/bindings';
import { useErrors } from '@/hooks/useErrors';
import { nftUri } from '@/lib/nftUri';
import { useWalletState } from '@/state';
import { useEffect, useState } from 'react';
import { DropdownSelector } from './DropdownSelector';

export interface TokenSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: string[];
  className?: string;
}

export function TokenSelector({
  value,
  onChange,
  disabled = [],
  className,
}: TokenSelectorProps) {
  const walletState = useWalletState();
  const { addError } = useErrors();

  const [tokens, setTokens] = useState<CatRecord[]>([]);
  const [selectedToken, setSelectedToken] = useState<CatRecord | null>(null);

  useEffect(() => {
    commands
      .getCats({})
      .then((data) => {
        if (tokens.length) return;

        setTokens(data.cats);

        if (value && !selectedToken) {
          setSelectedToken(
            data.cats.find((token) => token.asset_id === value) ?? null,
          );
        }
      })
      .catch(addError);
  }, [addError, tokens.length, value, selectedToken]);

  const defaultImage = nftUri(null, null);

  return (
    <DropdownSelector
      totalItems={walletState.nfts.visible_nfts}
      loadedItems={tokens}
      page={0}
      isDisabled={(token) => disabled.includes(token.asset_id)}
      onSelect={(token) => {
        onChange(token.asset_id);
        setSelectedToken(token);
      }}
      className={className}
      renderItem={(token) => (
        <div className='flex items-center gap-2 w-full'>
          <img
            src={token.icon_url ?? defaultImage}
            className='w-10 h-10 rounded object-cover'
            alt={token.name ?? 'Unknown'}
          />
          <div className='flex flex-col truncate'>
            <span className='flex-grow truncate'>{token.name}</span>
            <span className='text-xs text-muted-foreground truncate'>
              {token.asset_id}
            </span>
          </div>
        </div>
      )}
    >
      <div className='flex items-center gap-2 min-w-0'>
        <img
          src={
            selectedToken
              ? (selectedToken.icon_url ?? defaultImage)
              : defaultImage
          }
          className='w-8 h-8 rounded object-cover'
        />
        <div className='flex flex-col truncate text-left'>
          <span className='truncate'>
            {selectedToken?.name ?? 'Select Token'}
          </span>
          <span className='text-xs text-muted-foreground truncate'>
            {selectedToken?.asset_id}
          </span>
        </div>
      </div>
    </DropdownSelector>
  );
}
