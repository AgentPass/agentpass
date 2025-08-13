type Props = {
  className?: string;
  small?: boolean;
};

export const Logo = ({ className, small }: Props) => (
  <h1 className={`${className} ${small ? "text-2xl" : "text-4xl"} font-ancroli`}>
    <span className="text-blue-500">AgentPass.ai</span>
  </h1>
);
