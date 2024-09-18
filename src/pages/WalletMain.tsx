import {
  ArrowForward,
  CompareArrows,
  ForkRight,
  MoreVert,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import BigNumber from 'bignumber.js';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commands } from '../bindings';
import CoinList from '../components/CoinList';
import { useWalletState } from '../state';

export function MainWallet() {
  const navigate = useNavigate();
  const walletState = useWalletState();

  const [selectedCoins, setSelectedCoins] = useState<GridRowSelectionModel>([]);
  const [isCombineOpen, setCombineOpen] = useState(false);
  const [isSplitOpen, setSplitOpen] = useState(false);
  const [combineFee, setCombineFee] = useState('');
  const [splitOutputCount, setSplitOutputCount] = useState('');
  const [splitFee, setSplitFee] = useState('');

  const splitFeeRef = useRef<HTMLInputElement>(null);

  const combineFeeNum = BigNumber(combineFee);
  const splitOutputCountNum = BigNumber(splitOutputCount);
  const splitFeeNum = BigNumber(splitFee);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const canCombine =
    !combineFeeNum.isNaN() &&
    BigNumber(walletState.sync.balance).gte(combineFeeNum);

  const combine = () => {
    if (!canCombine) return;

    commands.combine(selectedCoins as string[], combineFee).then((result) => {
      setCombineOpen(false);

      if (result.status === 'ok') {
        setSelectedCoins([]);
      }
    });
  };

  const outputCountValid =
    !splitOutputCountNum.isNaN() &&
    splitOutputCountNum.isLessThanOrEqualTo(4294967295);
  const splitFeeValid =
    !splitFeeNum.isNaN() &&
    BigNumber(walletState.sync.balance).gte(splitFeeNum);
  const canSplit = outputCountValid && splitFeeValid;

  const split = () => {
    if (!canSplit) return;

    commands
      .split(
        selectedCoins as string[],
        splitOutputCountNum.toNumber(),
        splitFee,
      )
      .then((result) => {
        setSplitOpen(false);

        if (result.status === 'ok') {
          setSelectedCoins([]);
        }
      });
  };

  return (
    <>
      <Box mt={1}>
        <Typography variant='h5' fontSize={30} textAlign='center'>
          {walletState.sync.balance} {walletState.sync.unit.ticker}
        </Typography>

        {walletState.sync.total_coins > walletState.sync.synced_coins && (
          <LinearProgress
            variant='determinate'
            value={Math.ceil(
              (walletState.sync.synced_coins / walletState.sync.total_coins) *
                100,
            )}
            sx={{ mt: 2 }}
          />
        )}

        <Box mt={2} textAlign='center'>
          {walletState.sync.synced_coins}
          {walletState.sync.synced_coins === walletState.sync.total_coins
            ? ' coins synced'
            : `/${walletState.sync.total_coins} coins synced`}
        </Box>

        <Box display='flex' gap={2} mt={2}>
          <Button
            variant='outlined'
            size='large'
            sx={{ flexGrow: 1 }}
            onClick={() => navigate('/send')}
          >
            Send
          </Button>
          <Button
            variant='outlined'
            size='large'
            sx={{ flexGrow: 1 }}
            onClick={() => navigate('/receive')}
          >
            Receive
          </Button>
        </Box>

        <Box height={350} position='relative' mt={2}>
          <CoinList
            coins={walletState.coins}
            selectedCoins={selectedCoins}
            setSelectedCoins={setSelectedCoins}
          />

          <Box
            position='absolute'
            top={9}
            right={5}
            display={selectedCoins.length === 0 ? 'none' : 'block'}
          >
            <IconButton onClick={handleClick}>
              <MoreVert />
            </IconButton>

            <Menu
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
            >
              <MenuItem
                disabled={selectedCoins.length < 2}
                onClick={() => {
                  setCombineOpen(true);
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <CompareArrows fontSize='small' />
                </ListItemIcon>
                <ListItemText>Combine</ListItemText>
              </MenuItem>

              <MenuItem
                disabled={selectedCoins.length === 0}
                onClick={() => {
                  setSplitOpen(true);
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <ForkRight fontSize='small' />
                </ListItemIcon>
                <ListItemText>Split</ListItemText>
              </MenuItem>

              <MenuItem disabled={selectedCoins.length === 0}>
                <ListItemIcon>
                  <ArrowForward fontSize='small' />
                </ListItemIcon>
                <ListItemText>Transfer</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={isCombineOpen}
        onClose={() => {
          setCombineOpen(false);
        }}
      >
        <DialogTitle>Combine {walletState.sync.unit.ticker}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will combine all of the selected coins into one.
          </DialogContentText>
          <TextField
            label='Network Fee'
            variant='standard'
            margin='dense'
            required
            fullWidth
            autoFocus
            value={combineFee}
            error={combineFee.length > 0 && !canCombine}
            onChange={(event) => setCombineFee(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                combine();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(event) => {
              event.preventDefault();
              setCombineOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={(event) => {
              event.preventDefault();
              combine();
            }}
            autoFocus
            disabled={!canCombine}
          >
            Combine
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSplitOpen}
        onClose={() => {
          setSplitOpen(false);
        }}
      >
        <DialogTitle>Split {walletState.sync.unit.ticker}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will split all of the selected coins.
          </DialogContentText>
          <TextField
            label='Output Count'
            variant='standard'
            margin='dense'
            required
            fullWidth
            autoFocus
            value={splitOutputCount}
            error={splitOutputCount.length > 0 && !outputCountValid}
            onChange={(event) => setSplitOutputCount(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                splitFeeRef.current?.focus();
              }
            }}
          />
          <TextField
            inputRef={splitFeeRef}
            label='Network Fee'
            variant='standard'
            margin='dense'
            required
            fullWidth
            sx={{ mt: 1 }}
            value={splitFee}
            error={splitFee.length > 0 && !splitFeeValid}
            onChange={(event) => setSplitFee(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                split();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(event) => {
              event.preventDefault();
              setSplitOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={(event) => {
              event.preventDefault();
              split();
            }}
            autoFocus
            disabled={!canSplit}
          >
            Split
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
