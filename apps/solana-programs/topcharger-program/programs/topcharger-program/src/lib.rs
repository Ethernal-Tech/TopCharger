use anchor_lang::prelude::*;

declare_id!("FPmUDY73xYusKgVyAgKtFhv18vC3gaHWPm2BmWko8JZ7");

#[program]
pub mod topcharger_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
