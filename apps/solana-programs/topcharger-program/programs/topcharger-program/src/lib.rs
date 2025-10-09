use anchor_lang::prelude::*;

declare_id!("FPmUDY73xYusKgVyAgKtFhv18vC3gaHWPm2BmWko8JZ7"); // replace with your program ID

#[program]
pub mod topcharger_program {
    use super::*;

        /// Register a user (host or driver)
    pub fn register_user(
        ctx: Context<RegisterUser>,
        role: u8,               // 0 = driver, 1 = host
        user_id_hash: [u8; 32], // hashed UUID/email
    ) -> Result<()> {

        Ok(())
    }

    /// Host adds a charger
    pub fn create_charger(
        ctx: Context<CreateCharger>,
        user_id_hash: [u8; 32],
        charger_id: u64,
        power_kw: u16,
        supply_type: u8, // e.g. 0=AC, 1=DC
        price: u64,
        location: String,
    ) -> Result<()> {

        Ok(())
    }

    /// Driver reserves a charger (allocates)
    pub fn reserve_charger(ctx: Context<ReserveCharger>, driver_user_hash: [u8; 32]) -> Result<()> {

        Ok(())
    }

    /// Driver confirms charging complete
    pub fn confirm_charge(ctx: Context<ConfirmCharge>, was_correct: bool) -> Result<()> {
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(role: u8, user_id_hash: [u8; 32])]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<UserAccount>(),
        seeds = [b"user", user_id_hash.as_ref()],
        bump
    )]
    pub user: Account<'info, UserAccount>,

    /// The user's wallet (used for future payments or verification)
    pub wallet: SystemAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>, // backend or same wallet for now

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(user_id_hash: [u8; 32], charger_id: u64)]
pub struct CreateCharger<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<ChargerAccount>(),
        seeds = [b"charger", user_id_hash.as_ref(), &charger_id.to_le_bytes()],
        bump
    )]
    pub charger: Account<'info, ChargerAccount>,

    /// Host wallet (for payouts, identification)
    pub wallet: SystemAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReserveCharger<'info> {
    #[account(mut)]
    pub charger: Account<'info, ChargerAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<MatchAccount>(),
        seeds = [b"match", charger.key().as_ref()],
        bump
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(mut)]
    pub authority: Signer<'info>, // backend wallet

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmCharge<'info> {
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,
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
