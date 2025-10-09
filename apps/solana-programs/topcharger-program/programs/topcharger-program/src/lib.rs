use anchor_lang::prelude::*;

declare_id!("FPmUDY73xYusKgVyAgKtFhv18vC3gaHWPm2BmWko8JZ7"); // replace with your program ID

#[program]
pub mod topcharger_program {
    use super::*;
}
/// On-chain user record (host or driver)
#[account]
pub struct UserAccount {
    pub user_id_hash: [u8; 32],
    pub role: u8,       // 0=driver, 1=host
    pub wallet: Pubkey, // user wallet for future rewards/payments
}

/// EV charger owned by a host
#[account]
pub struct ChargerAccount {
    pub user_id_hash: [u8; 32],
    pub host_wallet: Pubkey,
    pub charger_id: u64,
    pub power_kw: u16,
    pub supply_type: u8,
    pub price: u64,
    pub status: u8, // 0=available, 1=allocated
    pub location: [u8; 64],
}

/// Match between driver and charger
#[account]
pub struct MatchAccount {
    pub driver_user_hash: [u8; 32],
    pub charger: Pubkey,
    pub status: u8, // 0=pending, 1=completed
    pub confirmed_correct: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Charger is not available")]
    ChargerNotAvailable,
}
